# Ticket 8 — Paille : aucune paille consommée (logement ET alimentation)

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §8.
> Statut : **à traiter** · Priorité : **haute** · Type : bug
> Seche liée : ticket **2** (même bloc paille, à traiter de concert) · ticket **3** (unités)
> Date de l'analyse : 2026-11-16

---

## 1. Analyse du bug

### 1.1 Ce que dit la capture (image007)

Dans _STOCKS ET COUTS_, la ligne « La paille » affiche une consommation incohérente
(`paille 10000 / 0 / 0 / 23 / -9977 / 9978`). La production paille existe (les baguettes
produisent de la paille via `Rdt_paille`), mais **la consommation n'est pas comptée
correctement** — ni en logement, ni en alimentation.

### 1.2 La chaîne de calcul de la paille (état actuel)

La paille (code `STRAW`) est traitée de façon **spéciale** partout :

**Production** (`mixins.js` `setTotalStrawStock`, L1307) :

```js
export function setTotalStrawStock(simulation, getStic) {
  let totalStrawStock = 0;
  simulation.farm.rotations.forEach((rotation) => {
    const stic = getStic(simulation.climaticYear, rotation.name);
    // le stock de paille produit en kg car rendement en kg/ha et surface en ha
    if (stic.rendement) {
      totalStrawStock += Number(stic.rendement) * rotation.surface;
    }
  });
  return totalStrawStock / 1000; // → tonnes
}
```

⚠️ **Bug 1 (production)** : `setTotalStrawStock` itère **toutes** les rotations et somme
`stic.rendement * surface` **sans filtrer** sur les baguettes dont le rendement est de la
**paille** (`Rdt_paille`). `stic.rendement` (champ `rendement` du STIC) est un rendement
générique — pour une baguette de blé, c'est le rendement en grain/céréale, **pas** la
paille. La production paille est donc **faussée** (surestimée par les rendements grain,
ou sous-estimée). D'où le `10000` de production incohérent dans la capture.

**Consommation** (`mixins.js` `getConsumptionForStraw`, L588) :

```js
export function getConsumptionForStraw(simulation, periods) {
  return (
    getConsumptionForOthers(simulation, periods, "STRAW") + // conso aliment
    getConsumptionOfNonFoodStraw(simulation, periods) // conso logement
  );
}
```

La consommation théorique existe donc bien **en deux volets** :

- **Conso aliment** : `getConsumptionForOthers(sim, periods, 'STRAW')` (L562) →
  `getBatchConsumption(batch, p.id, 'STRAW')` (L665) : somme des
  `proportion × besoinMS` des aliments du lot dont `correspondingStock === 'STRAW'`.
- **Conso logement** : `getConsumptionOfNonFoodStraw` (L710) :
  ```js
  const besoin = batch.housing.type ? batch.housing.type.straw_requirement : 0;
  const presence = batch.housing.presence[i].days;
  const nbAni = batch.housing.presence[i].animalCount;
  const byBatch = (besoin * presence * besoinMS * nbAni) / 13;
  ```

**Stock final** (`getFinalStockByBarnStockItem`, L619) :

```js
if (stockCode === "STRAW") {
  return (
    simulation.barn.totalStrawStockProducted -
    getConsumptionForStraw(simulation, periods)
  );
}
```

⚠️ **Bug 2 (stock final)** : la ligne paille **ne tient pas compte du stock initial**
(`initialStocks` STRAW). Les autres codes font
`initialStock + production - consommation` ; la paille fait
`production - consommation`. Le stock initial de paille (saisi dans la Grange) est
**ignoré**.

### 1.3 La vraie cause racine de « aucune paille consommée » : **la paille n'est pas distribuable**

C'est le point clé, et c'est **le même que le ticket 1** :

- Pour que `getConsumptionForOthers(…, 'STRAW')` soit non nul, il faut un aliment dont
  `correspondingStock === 'STRAW'` **distribué à un lot**.
- Or la **paille n'est pas dans la liste des types de stock**
  (`barnStockItems`, `referential.js` L42-52 : `FH, EH, EM, RC, RP, AS, EL, FL` —
  **pas de `STRAW`**). Elle n'a pas de carte ration référentielle non plus
  (`fichier_type_ration.csv` a une ligne « Paille » mais sans
  `stock_correspondant` — cf. ligne `"Paille";"Paille";…;;`).
- **Conséquence** : l'utilisateur ne peut **pas** distribuer de paille en alimentation
  (pas de carte, pas de stock). Donc `conso aliment = 0` **toujours**.
- La seule paille consommée est la **conso logement** (`straw_requirement`). Mais avec la
  formule `(besoin × jours × besoinMS × nbAni) / 13` (besoin en kg/UGB/j, `besoinMS` en
  tMS/animal/j…), le résultat est **incohérent en dimension** (cf. 1.4) et le stock
  final n'intègre pas le stock initial → d'où le `-9977` de la capture.

> **Synthèse** : « aucune paille consommée » = la paille aliment est **inaccessible**
> (pas de carte/stock `STRAW`, ticket 1) + la paille logement est **mal calculée**
> (dimension) + le stock final **ignore le stock initial** + la production est **faussée**
> (rendement non filtré).

### 1.4 Problème de dimension de la conso logement (à arbitrer)

`straw_requirement` est en **kg/UGB/j** (cf. `fichier_type_logement.csv` : « Aire paillée
intégrale » = 50, « Logettes » = 4, …). La formule actuelle :

```
byBatch = (straw_requirement × jours × besoinMS × nbAni) / 13
```

multiplie le besoin en paille (kg/UGB/j) par `besoinMS` (tMS/animal/j) — **pas
dimensionnellement correct**. La formule attendue (alignée sur l'Excel de référence,
image009) est :

```
paille_logement (t) = Σ_lots Σ_périodes  (straw_requirement [kg/UGB/j]
                              × nb_animaux × UGB_animal × jours_période)  / 1000 [kg→t]
```

Il faut donc introduire le **nombre d'UGB par animal** (ou par lot) à la place de
`besoinMS`. L'Excel référence (image009) utilise bien `besoin paille (kg/ugb/j) ×
présence × nb UGB`.

### 1.5 Résumé des causes racines

| #   | Cause                                                                                                                                     | Où                                                    | Impact                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| P1  | Paille non distribuable : pas de code `STRAW` dans `barnStockItems`, pas de carte ration « Paille » avec `stock_correspondant=STRAW`      | `referential.js` L42-52, `fichier_type_ration.csv`    | conso **aliment** toujours = 0 |
| P2  | Production paille faussée : `setTotalStrawStock` somme `stic.rendement × surface` sans filtrer sur les baguettes à paille (`Rdt_paille`)  | `mixins.js` L1307                                     | production incohérente (10000) |
| P3  | Conso logement mal dimensionnée : `straw_requirement (kg/UGB/j) × besoinMS (tMS/animal/j)` au lieu de `× nb_animaux × UGB_animal × jours` | `mixins.js` L710-730 (`getConsumptionOfNonFoodStraw`) | conso **logement** incohérente |
| P4  | Stock final paille ignore le stock initial (`production - consommation` au lieu de `initial + production - consommation`)                 | `mixins.js` L619-622                                  | bilan paille faux              |
| P5  | Pas de distinction paille logement / paille alimentation dans STOCKS ET COUTS (demande « souhaitable » du ticket)                         | `report.js` `getStrawStock` L159                      | pas de lisibilité              |

---

## 2. Recommandations (plan de correction)

> ⚠️ **Traiter de concert avec le ticket 2** (même bloc paille) et **après le ticket 1**
> (qui rend les cartes custom distribuable — la carte « Paille » en dépend).

### 2.1 Rendre la paille aliment distribuable (P1) — **prérequis ticket 1**

1. **Ajouter `STRAW` dans `barnStockItems`** (`referential.js` L42-52) :
   ```js
   { code: 'STRAW', name: 'Paille', unity: 'tMS', color: '' },
   ```
   → la paille devient un type de stock sélectionnable (Grange + carte ration).
   ⚠️ Cela **révise** l'analyse du ticket 1 §1.3.1 (« une carte n'est pas un type de
   stock ») : pour la paille spécifiquement, le code `STRAW` doit exister comme type de
   stock cible. À confirmer avec INRAE (la paille est à la fois un stock **et** une
   litière).
2. **Créer la carte ration référentielle « Paille »** avec `stock_correspondant = STRAW`
   (dans `fichier_type_ration.csv`, renseigner la colonne `stock_correspondant` de la
   ligne « Paille » → `STRAW`). Ainsi la paille aliment est distribuée via une carte,
   comme n'importe quel autre fourrage.

### 2.2 Corriger la production paille (P2)

**Check (2026-11-17, corrigé)** : la colonne CSV `Rdt_paille` contient bien le
**rendement paille** de la culture céréale (résidu paille après moisson grain), mappé
sur `Stic.rendement`. Les preuves dans le CSV :

- toutes les valeurs `Rdt_paille` non vides sont sur des lignes de type `C` (céréales : Blé, Orge, Triticale, Méteil) ;
- les descriptions disent explicitement « Méteil récolté **en grain** » (la moisson est en grain, le résidu est de la paille) ;
- les baguettes type `PP`/`PT`/`PC` (pâture, ensilage) ont `Rdt_paille` vide.

➡️ **Implémenté** : `setTotalStrawStock` somme `stic.rendement × rotation.surface`
(= rendement paille × surface), sans nouvelle colonne. **Pas de migration, pas de
colonne CSV additionnelle.** Le rendement paille est déjà dans `rendement`.

> NB : j'avais d'abord interprété `rendement` comme « rendement grain » et ajouté une
> colonne `straw_yield` + migration + colonne CSV `Rdt_paille2`. C'était une erreur —
> `Rdt_paille` est bien le rendement paille. Replié le 2026-11-17 (commit de
> correction) : suppression de `straw_yield`, de la migration et de `Rdt_paille2`.

### 2.3 Corriger la conso logement (P3)

`getConsumptionOfNonFoodStraw` : remplacer `besoinMS` par le **nombre d'UGB du lot**
sur la période :

```js
const ugbPerAnimal = /* UGB par animal selon type de lot (batch_type) */
const byBatch = (straw_requirement * presenceDays * nbAni * ugbPerAnimal) / 1000  // kg→t
```

Il faut une source d'**UGB par animal** : soit une colonne dans `batch_type`
(à ajouter), soit la valeur déjà utilisée par `getUGBSystem`/`getUGBtoFeed`
(`mixins.js`). **À arbitrer avec INRAE** : la formule exacte de la litière
(`kg/UGB/j × jours × nb_animaux × UGB_animal`).

### 2.4 Corriger le stock final paille (P4)

`getFinalStockByBarnStockItem` (L619) : aligner la paille sur la logique générale :

```js
if (stockCode === "STRAW") {
  return (
    getInitialStockByBarnStockItem(simulation, "STRAW") +
    getSticProductionByBarnStockItemStraw(simulation, periods) - // = setTotalStrawStock (corrigé P2)
    getConsumptionForStraw(simulation, periods)
  );
}
```

(ou uniformiser : ne plus avoir de branche `STRAW` spéciale et passer la paille dans le
même `initial + production - consommation` que les autres, en injectant la production
paille via `getSticProductionByBarnStockItem`).

### 2.5 Distinguer paille logement / paille alimentation (P5) — « souhaitable »

Dans `report.js` `getStrawStock` (L159), **décliner la ligne paille en deux sous-lignes** :

- `Paille (alimentation)` : `getConsumptionForOthers(sim, periods, 'STRAW')` ;
- `Paille (logement)` : `getConsumptionOfNonFoodStraw(sim, periods)`.

Affichage : deux lignes dans la section « La paille » de STOCKS ET COUTS (ou un
sous-total). L'achat/vente/`purchase` reste sur la paille globale.

### 2.6 Tests à ajouter (`tests/unit/vuex/`)

- `report.spec.js` (ou nouveau `straw.spec.js`) :
  - **conso aliment** : simulation avec 1 lot distribuant une carte « Paille »
    (`correspondingStock: 'STRAW'`) → `getConsumptionForOthers(…, 'STRAW')` > 0 ;
  - **conso logement** : lot avec `housing.type.straw_requirement = 4` et présence →
    `getConsumptionOfNonFoodStraw` > 0 et **cohérent en dimension** (t, pas t×t) ;
  - **stock final** : `initialStock STRAW + production - conso` (vérifier le stock
    initial est pris en compte) ;
  - **production** : baguettes avec `rendement` (= `Rdt_paille`, rendement paille)
    → `setTotalStrawStock` somme `rendement × surface` (pas de distinction
    grain/paille — la colonne CSV est bien la paille).

---

## 3. Fichiers impactés (récap)

| Fichier                                                                                  | Changement                                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `services/frontend/ui/src/store/modules/referential.js` (L42-52)                         | ajouter `STRAW` dans `barnStockItems` (P1)                                      |
| `services/backend/referential/fichier_type_ration.csv`                                   | renseigner `stock_correspondant = STRAW` sur la ligne « Paille » (P1)           |
| `services/frontend/ui/src/store/modules/mixins.js` (`setTotalStrawStock` L1318)          | sommer `rendement × surface` — `Rdt_paille` est déjà mappé sur `rendement` (P2) |
| `services/frontend/ui/src/store/modules/mixins.js` (`getConsumptionOfNonFoodStraw` L710) | formule logement en UGB (P3)                                                    |
| `services/frontend/ui/src/store/modules/mixins.js` (`getFinalStockByBarnStockItem` L619) | stock final paille avec stock initial (P4)                                      |
| `services/frontend/ui/src/store/modules/report.js` (`getStrawStock` L159)                | deux sous-lignes paille aliment/logement (P5)                                   |
| `tests/unit/vuex/straw.spec.js` (nouveau)                                                | tests conso aliment, logement, stock final, production                          |

> ℹ️ **Pas de changement backend** : `Rdt_paille` (rendement paille) est déjà mappé sur
> `Stic.rendement`. Aucune migration, aucune colonne additionnelle (la 1re version du fix
> ajoutait `straw_yield` par erreur — repliée, cf. §2.2). Ticket 100 % frontend.

---

## 4. Critères d'acceptation

1. Une **carte ration « Paille »** (`correspondingStock: STRAW`) est distribuable à un
   lot (Troupeau → lot → Aliments) — **dépend du ticket 1**.
2. Dans _STOCKS ET COUTS_, la section « La paille » affiche **deux sous-lignes** :
   alimentation (non nulle si paille distribuée) et logement (non nulle si
   `straw_requirement > 0` et présence).
3. La **production** paille correspond à la somme des `Rdt_paille` des baguettes
   (pas aux rendements grain).
4. Le **stock final** paille = stock initial + production − (conso aliment + conso
   logement).
5. Les tests unitaires paille passent (dimension correcte en tonnes).

## 5. Risques / points d'attention

- **Couplage ticket 1** : sans la fix du ticket 1 (cartes custom distribuable) et sans
  `STRAW` dans `barnStockItems`, la conso paille aliment reste à 0. Traiter le ticket 1
  d'abord.
- **Changement backend (P2) : absent** — `Rdt_paille` est déjà dans `Stic.rendement`
  (vérifié dans le CSV, §2.2) ; pas de migration, pas de re-seed.
- **Formule logement** (P3) : à valider avec INRAE (source d'UGB par animal, facteur de
  conversion). La formule actuelle `(besoin × jours × besoinMS × nbAni)/13` est
  dimensionnellement erronée — ne pas la « patcher » sans cadrage.
- **Ne pas mélanger avec le ticket 3** (unités t/qtx) : les changements d'unité sont
  séparés, mais le passage paille en tonnes (ticket 3) est ici déjà fait en t
  (`/1000`) — rester cohérent.

## 6. Estimation

| Bloc                                                           | Effort                                             |
| -------------------------------------------------------------- | -------------------------------------------------- |
| P1 — paille distribuable (`barnStockItems` + carte CSV)        | ~0,5 j                                             |
| P2 — production paille (`rendement × surface`, pas de backend) | ~0,25 j                                            |
| P3 — conso logement (formule UGB)                              | ~0,5 j                                             |
| P4 — stock final paille (stock initial)                        | ~0,25 j                                            |
| P5 — deux sous-lignes paille aliment/logement                  | ~0,5 j                                             |
| Tests unitaires                                                | ~0,5 j                                             |
| **Total**                                                      | **~3,25 j** (hors ticket 3 unités, après ticket 1) |
