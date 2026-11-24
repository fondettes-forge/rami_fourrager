# Ticket 10 — Périodes « vides » (couverture grisée / division par zéro ?)

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §10.
> Statut : **✅ Implémenté** · Priorité : **moyenne** · Type : bug
> Date de l'analyse : 2026-11-16 · Implémenté : 2026-11-24

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Comprendre pourquoi on a souvent des périodes « vides ».
> Apparemment : Ça peut être dans les cas où il n'y a que de la pâture
> distribuée. Si on met du foin (ex : 90% pâture et 10% foin, ça résout).
> Donc division par zéro (?)

### 1.2 Où est produit l'affichage « vide »

Le graphique « Couverture des besoins » (`components/parts/herd/GraphCoverage.vue`)
construit ses cellules avec :

```js
dataEnergeticCoverage.push([i, 1, energeticCoverage[i] || "-"]); // L97
dataProteicCoverage.push([i, 0, proteicCoverage[i] || "-"]); // L98
```

Une cellule est **grisée/vide** quand `energeticCoverage[i]` (ou
`proteicCoverage[i]`) est **falsy** (`0`, `undefined`, `NaN`).

Les couvertures finales viennent de `mixins.js` :

- `getFinalEnergeticCoverage` (L438) : `h276 = h274 / h234` (L462),
  `finalEnergeticCoverage[index] = _.round(h276 * 100)` (L464) ;
- `getFinalProteicCoverage` (L507) : `h276 = h274 / h234` (L530),
  `finalProteicCoverage[index] = _.round(h276 * 100)` (L532).

### 1.3 Les deux scénarios qui produisent un « vide »

**Scénario A — `h234` (besoin) = 0 → `h276 = h274 / 0 = Infinity` →
`_.round(Infinity * 100)` = `Infinity` → cellule `Infinity` (affichée anormale,
pas « vide »).**

`h234 = calculateEnergeticBesoin(ufl, toModerate)` = `ufl * moderator`
(L66-72). C'est **0 si `ufl` (UFL du profil) = 0**. Peu probable (les profils ont
un UFL).

**Scénario B — `h274` (UF apporté) = 0 avec pâture → `h276 = 0 / h234 = 0` →
`_.round(0)` = `0` → `0 || '-'` = `'-'` → **cellule vide/grisée**. ✅ C'est ça.**

Pourquoi `h274` = 0 quand 100 % pâture ?

`h274 = h272 + h267 + h249` :

- `h272` = UF concentrés = **0** (pas de concentré) ;
- `h267` = UF fourrages stockés = **0** (pas de foin — 100 % pâture) ;
- `h249` = **UF de la pâture** (`getUFPasturesByPeriod` → `getPasturesByPeriod('energeticTotal', …)`,
  L309).

`getPasturesByPeriod` (L309) retourne :

```js
const i246 = getGreenPastureConsumption(batch, period, …)  // consommation pâture verte
const i247 = getCarryOverPastureConsumption(batch, period, …)  // consommation pâture reportée
const currentVal = i246 * totalAvailablePastureByPeriod['period_id_'+(period+1)][coverage]
return fixFloatingPoint(currentVal + previous, 6)
```

➡️ **`h249` = consommation pâture (kgMS) × valeur énergétique de la pâture.**
Si la **pâture disponible dans la période est nulle**
(`totalAvailablePastureByPeriod[period_id_X].production_total = 0`), alors
`i246 = 0` (pas de pâture verte) et `h249 = 0` → **`h274 = 0`** → couverture
`0` → **cellule vide**.

**Et c'est exactement le cas « il n'y a que de la pâture distribuée »** : si
l'utilisateur a mis 100 % pâture **mais que la production de pâture de la
période est nulle** (saison, baguette), le modèle calcule 0 UF apporté →
couverture 0 → vide. Ajouter 10 % de foin (h267 > 0) « résout » car `h274`
redevient > 0.

### 1.4 Cause racine

| #   | Cause                                                                                                                                                                              | Où                                                                                                | Impact                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| V1  | Quand 100 % de la ration est en pâture **et que la production de pâture de la période est nulle**, `h274` (UF apporté) = 0 → couverture = 0 → cellule `0` → affichée `'-'` (grise) | `mixins.js` `getPasturesByPeriod` L309, `getFinalEnergeticCoverage` L438, `GraphCoverage.vue` L97 | période « vide » alors que des animaux sont présents |
| V2  | Pas de distinction entre « couverture = 0 (calculée) » et « période non applicable » — les deux s'affichent en gris                                                                | `GraphCoverage.vue` L97-98                                                                        | ambiguïté pour l'utilisateur                         |
| V3  | (secondaire) si le besoin `h234` est 0, `h276 = h274/0 = Infinity` (pas « vide » mais anormal)                                                                                     | `mixins.js` L462, L530                                                                            | valeur anormale possible                             |

> ⚠️ **Ce n'est PAS (ou pas seulement) une simple « division par zéro »** au sens
> d'une exception : le calcul ne lève pas d'erreur, il **produit 0** (ou
> `Infinity`). Le « vide » est un **symptôme d'un apport nul** (pâture sans
> production), pas d'un crash.

---

## 2. Recommandations (plan de correction)

### 2.1 Distinguer « couverture calculée = 0 » de « période non applicable » (V2)

L'affichage actuel confond les deux. **À clarifier avec INRAE** : une période où
des animaux sont présents mais où la couverture est 0 (pas de fourrage stock,
pas de pâture produite) est **significative** (besoins non couverts) — elle doit
s'afficher en **0 % (rouge)**, pas en gris.

Concrètement, dans `GraphCoverage.vue` :

```js
// aujourd'hui :
dataEnergeticCoverage.push([i, 1, energeticCoverage[i] || "-"]);
// proposé :
// si animaux présents → afficher la valeur (même 0) ; sinon '-' (vraiment vide)
const hasAnimals = this.selectedLot.housing.presence[i].animalCount > 0;
dataEnergeticCoverage.push([i, 1, hasAnimals ? energeticCoverage[i] : "-"]);
```

➡️ **À valider** : `getFinalEnergeticCoverage` renvoie déjà **0** quand
`animalCount = 0` ? Non — il ne vérifie **pas** la présence (contrairement à
`getEnergeticCoverage` L1138 qui renvoie 0 si pas d'animaux). Il faut donc
vérifier la présence **côté affichage** (2.1) ou **côté calcul**.

### 2.2 Gérer le cas « pâture sans production » (V1)

Quand l'utilisateur répartit 100 % en pâture mais que la production de la
période est 0, le modèle est **cohérent** (0 pâture disponible = 0 UF). Le
problème est **l'affichage** (gris ambigu) plus que le calcul.

Options :

- **A (recommandé)** : garder le calcul, améliorer l'affichage (2.1) + ajouter
  un **tooltip** sur la cellule : « Couverture 0 % : aucune pâture produite sur
  cette période » (détecte `totalAvailablePastureByPeriod[period].production_total === 0`
  - proportion pâture = 100 %).
- **B** : avertir l'utilisateur **à la saisie** (Troupeau) : « attention, 100 %
  de la ration est en pâture mais la production de la période P7 est nulle ».
  Plus de code (validation à la saisie).

### 2.3 Garde anti-`Infinity` (V3)

Dans `getFinalEnergeticCoverage` / `getFinalProteicCoverage`, ajouter une garde
sur `h234` :

```js
const h276 = h234 > 0 ? h274 / h234 : 0;
```

➡️ Évite `Infinity` si un profil a UFL/PDI = 0.

---

## 3. Fichiers impactés (récap)

| Fichier                                                | Changement                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `src/components/parts/herd/GraphCoverage.vue` (L97-98) | distinguer « 0 calculé » de « non applicable » (2.1) + tooltip (2.2A) |
| `src/store/modules/mixins.js` (L462, L530)             | garde `h234 > 0` (2.3)                                                |
| (option 2.2B) `components/parts/herd/ClassicFeed.vue`  | avertissement à la saisie                                             |

---

## 4. Critères d'acceptation

1. Une période avec des animaux présents et 100 % de ration en pâture **mais
   production de pâture nulle** s'affiche en **0 % (rouge)** avec un tooltip
   explicatif, **pas** en gris « vide ».
2. Une période **sans animaux** s'affiche bien en gris/`'-'` (vraiment vide).
3. Plus de valeur `Infinity`/anormale dans les couvertures (garde 2.3).
4. Les tests de couverture couvrent le cas « 100 % pâture, production 0 ».

## 5. Risques / points d'attention

- **Semantique à valider avec INRAE** : « couverture 0 % » vs « période vide »
  — le choix d'affichage (rouge vs gris) est un **choix de rendu**, pas de
  calcul. À confirmer avec Antoine.
- **Ne pas changer le calcul de couverture** (2.1 ne touche que l'affichage) :
  le calcul `h274/h234` est cohérent avec le modèle Excel ; le bug est
  l'affichage ambigu, pas le calcul.
- **Lien avec le ticket 14** (valeurs pâtures VL/VA) : la production/UF de la
  pâture dépend des valeurs nutritionnelles des pâtures — si le ticket 14
  modifie les valeurs pâture, ce ticket peut être impacté (mais indépendamment).

## 6. Estimation

| Bloc                                                    | Effort                                                  |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Affichage : distinguer 0 calculé / non applicable (2.1) | ~0,5 j                                                  |
| Tooltip explicatif (2.2A)                               | ~0,5 j                                                  |
| Garde anti-`Infinity` (2.3)                             | ~0,1 j                                                  |
| Tests                                                   | ~0,5 j                                                  |
| **Total**                                               | **~1,5 j** (hors option 2.2B avertissement à la saisie) |

## 7. Implémentation (2026-11-24)

**V3 — Garde anti-division par zéro** (`mixins.js`) :

- `getFinalEnergeticCoverage` (L457) : `const h276 = h234 > 0 ? h274 / h234 : 0`
- `getFinalProteicCoverage` (L525) : `const h276 = h234 > 0 ? h274 / h234 : 0`
  → plus de `Infinity` si le besoin (UFL/PDI) est 0.

**V2 — Affichage** (`GraphCoverage.vue`) :

- Distinguer « couverture = 0 (animaux présents) » de « période non applicable » :
  ```js
  const hasAnimals =
    this.selectedLot.housing.presence[i] &&
    this.selectedLot.housing.presence[i].animalCount > 0;
  dataEnergeticCoverage.push([i, 1, hasAnimals ? energeticCoverage[i] : "-"]);
  dataProteicCoverage.push([i, 0, hasAnimals ? proteicCoverage[i] : "-"]);
  ```
  → si des animaux sont présents, la valeur est affichée (même 0) ; sinon `'-'` (gris).

**V1 — Tooltip explicatif** (`GraphCoverage.vue`) :

- Activation du tooltip (`show: true`) + `formatter` :
  ```js
  formatter: (params) => {
    const value = params.data[2]
    if (value === 0) {
      return `${params.name}<br/>Couverture 0 % : aucun apport (pâture, fourrage, concentré) sur cette période`
    }
    return `${params.name}<br/>Couverture : ${value} %`
  },
  ```
  → au survol d'une cellule à 0 %, le message explicatif s'affiche.

**Non fait** :

- **Option 2.2B** (avertissement à la saisie) : non fait (hors périmètre).

**Tests** : `coverage.spec.js` (nouveau) — 6 tests :

- V3 : `h234 = 0` → couverture 0 (pas Infinity) pour énergétique + protéique ;
  couverture normale (`h234 > 0`) → valeur finie.
- V2 : logique d'affichage (animaux présents → valeur, pas d'animaux → `'-'`,
  mélange).

**Tests** : 6/6 ✅ (`coverage.spec.js`) ; 36/36 au total (straw + referential +
concentrated + coverage).
