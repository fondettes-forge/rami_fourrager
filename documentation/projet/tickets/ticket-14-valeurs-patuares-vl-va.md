# Ticket 14 — Valeurs alimentaires des pâtures (VL / VA) — à clarifier

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §14.
> Statut : **à clarifier** · Priorité : **moyenne** · Type : à clarifier
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Valeurs alimentaires des pâtures : comment gérer le commentaire ci-dessous ?

La capture (`image015.png`) est un extrait Excel « Valeurs nutritives (UF-PDI)
des types de pâtures » avec un **commentaire rouge** : pour des systèmes en
**vaches allaitantes (VA)**, il peut être utile de **baïsser la valeur de
certaines pâtures** (graminées, légumineuses et monospécifiques) — avec une
table de valeurs **VL vs VA** (UFL/UFV/PDIN/PDIE/PDIinf) à copier-coller « si on
veut utiliser ».

### 1.2 État actuel dans le Rami

**Référentiel des pâtures** : le modèle `PastureType`
(`models.py` L85) a une relation vers `NutritionalValues` (UFL, UFV, PDIN, PDIE,
PDI_inf — L148-152). **Un seul jeu de valeurs** par type de pâture, **indépendant
du type de système** (VL/VA).

**Côté calcul** : les valeurs de pâture sont lues dans
`setTotalAvailablePasture` (`mixins.js` L87-144) :

```js
// L116
((sp.production * rotation.surface) / total) * stic.pasture_type.nutritional_values.UFL
// L130
(calcul / total) * stic.pasture_type.nutritional_values.PDI_inf
```

➡️ **Le calcul utilise les mêmes valeurs UFL/PDI_inf quelle que soit le type de
système** (VL ou VA). **Aucune distinction VL/VA n'est faite sur les valeurs de
pâture.**

**Le modérateur VL/VA existe déjà** : `calculateBesoinMS` (L56),
`calculateEnergeticBesoin` (L66), `calculateProteicBesoin` (L74) appliquent un
**modérateur** si `batch_type.code === 'VL'` (vache laitière) :

```js
if (toModerate) { moderator = 0.1582 * potential + 0.8392 }  // besoin MS
if (toModerate) { moderator = 0.5367 * potential + 0.4582 }  // besoin UF
if (toModerate) { moderator = 0.6431 * potential + 0.3522 }  // besoin PDI
```

Mais ces modérateurs s'appliquent aux **besoins** (H233/H234/H235), **pas aux
valeurs des pâtures**.

**Le commentaire « à minorer pour les VA »** est présent dans le code
(`models.py` L138, sous `FeedType`) — c'est une **intention connue** mais
**non implémentée**.

### 1.3 La question à clarifier

Le mail **ne demande pas de décision** — il demande de **répondre à la question**
et de **cadrer la solution** : *comment gérer la déclinaison des valeurs des
pâtures selon le type de système (VL/VA) ?*

Deux approches possibles :

- **Option A — Jeu de valeurs VA distinct** : ajouter au `PastureType` un
  **second jeu de valeurs** (VA) en plus de celui existant (VL). Le calcul lit
  le bon jeu selon `batch_type.code`.
  - ✅ Simple conceptuellement ; les valeurs VA sont explicitement saisies dans
    le référentiel (comme la table de l'Excel).
  - ❌ Double la saisie référentielle ; nécessite une migration backend
    (nouvelles colonnes ou une seconde relation `NutritionalValues`).

- **Option B — Facteur de minoration** : garder un seul jeu de valeurs, et
  appliquer un **facteur** (ex. ×0.9) sur les valeurs pâture si le système est
  VA.
  - ✅ Pas de migration référentielle ; un seul paramètre.
  - ❌ Le facteur est **uniforme** (toutes les pâtures minorées pareil) —
    alors que le commentaire de l'Excel suggère de ne minorer que **certaines**
    pâtures (graminées, légumineuses, monospécifiques), pas toutes.

➡️ **La nuance clé** : le commentaire de l'Excel veut minorer **certaines**
pâtures (pas toutes), et la table donne des valeurs **différentes** selon le
type. **L'Option A (jeu VA distinct) est la plus fidèle à la demande** ;
l'Option B (facteur unique) est une simplification qui ne capture pas la
nuance « certaines pâtures seulement ».

### 1.4 Résumé

| # | Point | Où | Constat |
|---|-------|----|---------|
| C1 | Un seul jeu de valeurs pâture, indépendant VL/VA | `models.py` `PastureType`→`NutritionalValues`, `mixins.js` L116/L130 | pas de distinction VL/VA |
| C2 | Les modérateurs VL existent mais sur les **besoins**, pas les valeurs pâture | `mixins.js` L56-80 | la minoration VL/VA pâture n'est pas implémentée |
| C3 | Commentaire « à minorer pour les VA » présent mais non implémenté | `models.py` L138 | intention connue |
| C4 | Le mail demande de **cadrer** la solution, pas de l'implémenter | — | ticket de clarification |

---

## 2. Recommandation (cadrage à proposer à INRAE/Antoine)

### 2.1 La question à trancher avec INRAE

1. **Toutes les pâtures sont-elles à minorer en VA, ou seulement certaines ?**
   (Le commentaire de l'Excel dit « certaines » — gram, légumineuses,
   monospécifiques.)
2. **Les valeurs VA sont-elles fixes** (table de l'Excel) **ou dérivées**
   (facteur sur les valeurs VL) ?
3. **L'unité de minoration** : est-ce par **type de pâture** (chaque type a sa
   valeur VA) ou par **groupe** (toutes les graminées minorées pareil) ?

### 2.2 La solution préconisée (Option A — jeu VA distinct)

Si la réponse est « certaines pâtures, valeurs différentes » :

1. **Référentiel** : étendre `PastureType` avec un **second jeu de valeurs VA**
   (nouvelles colonnes `UFL_va`, `UFV_va`, `PDIN_va`, `PDIE_va`, `PDI_inf_va`,
   ou une seconde relation `NutritionalValues` avec un indicateur VL/VA).
   - **Migration** backend (colonne ou table) + **CSV** référentiel
     (`fichier_type_pature.csv` avec colonnes VA, vides par défaut = valeurs VL
     si non renseignées).
2. **Calcul** : dans `setTotalAvailablePasture` (`mixins.js` L116/L130), choisir
   le bon jeu selon le type de système :
   ```js
   const isVA = <déterminer si le système est VA>  // à clarifier : comment ?
   const UFL = isVA && nv.UFL_va ? nv.UFL_va : nv.UFL
   ```
   ⚠️ **Sous-question** : comment savoir si le **système** est VA ? Le type de
   système est par **lot** (`batch_type.code`), pas global. Si un workspace a
   **mélange** VL et VA, il faudrait **deux valeurs de pâture par lot** (plus
   complexe). **À clarifier** : est-ce qu'un système Rami est **uniforme**
   (tous VL ou tous VA) ou peut-il **mélanger** ?
3. **Si le système est uniforme** : le choix VL/VA est global (paramètre du
   workspace ou du premier lot) → simple.
   **S'il peut mélanger** : il faudrait calculer la pâture **par lot** avec ses
   propres valeurs → complexe (actuellement la pâture est calculée **globalement**
   par `totalAvailablePastureByPeriod`, pas par lot).

### 2.3 Option B (facteur) — si la réponse est « toutes les pâtures, facteur fixe »

Plus simple : un facteur global `strawPastureModeratorVA` appliqué si le système
est VA. Pas de migration référentielle. Mais **ne capture pas** la nuance
« certaines pâtures ».

---

## 3. Fichiers impactés (si implémentation, selon le choix)

| Fichier | Option A (jeu VA) | Option B (facteur) |
|---------|-------------------|---------------------|
| `services/backend/.../models.py` (`PastureType`) | nouvelles colonnes VA / 2e relation | — |
| `services/backend/referential/fichier_type_pature.csv` | colonnes VA | — |
| Migration alembic | ✅ | — |
| `src/store/modules/mixins.js` (L116/L130) | choisir le jeu selon VL/VA | appliquer le facteur si VA |
| `src/store/modules/workspace.js` / paramètre | (si) paramètre VL/VA du workspace | (si) paramètre VL/VA |

---

## 4. Livrable de ce ticket (clarification)

**Il n'y a pas de code à écrire maintenant.** Le livrable est :

1. **Répondre au mail** : expliquer les deux options (A/B) et poser les
   questions 2.1 (certaines vs toutes les pâtures, valeurs fixes vs facteur,
   système uniforme vs mélangé).
2. **Obtenir la décision d'INRAE** avant toute implémentation.
3. **Estimer** l'implémentation selon la décision :
   - Option A, système uniforme : **~2 j** (migration + CSV + calcul).
   - Option A, système mélangé : **~3-4 j** (pâture par lot, plus complexe).
   - Option B : **~0,5 j** (facteur global).

## 5. Risques / points d'attention

- **Ne pas implémenter sans la décision** : le ticket est explicitement « à
  clarifier » — aucune décision n'est demandée dans le mail.
- **Système uniforme vs mélangé** : c'est le point qui change tout l'effort.
  Actuellement les lots peuvent être de types différents (`batch_type`) dans un
  même workspace — **à vérifier** si un système Rami peut mélanger VL et VA.
- **Lien avec le ticket 10** (périodes vides) : la production/UF de la pâture
  dépend de ces valeurs — si le ticket 14 modifie les valeurs pâture, le ticket
  10 peut être impacté (mais indépendamment).

## 6. Estimation

**0 j** (clarification uniquement). Implémentation à estimer **après** la
décision d'INRAE (2 à 4 j selon le cas).
