# Ticket 12 — Concentrés : tourteaux (colza, soja, …) absents de Stocks et Coûts

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §12.
> Statut : **à traiter** · Priorité : **haute (coulée)** · Type : nouveauté / bug
> Seche lié : ticket **1** (cartes custom distribuable — nécessaire pour que les cartes
> tourteaux custom remonte aussi) · ticket **13** (ordre des stocks Grange, même source
> `barnStockItems`)
> Date de l'analyse : 2026-11-16

---

## 1. Analyse du bug

### 1.1 Ce que dit la demande

> Concentrés : Tourteaux de colza, de soja, etc. On peut les fournir comme concentré,
> mais ils ne sont pas présents dans Stocks et Coûts.
> Explication (colonne Stock_correspondant) : cf. colonne noire.
> Option 1 : juste attribuer RP aux lignes Tourteau dans la colonne en noir.
> Option 2 : créer une catégorie RT (T pour tourteau) et du coup créer une nouvelle
> ligne dans STOCKS ET COUTS.

Captures :

- `image012.png` — « Les concentrés pour la période » : « Concentré céréales » 0,65 et
  « **Tourteau de colza** » 0,35 (surligné) — le tourteau est **distribuable**.
- `image013.png` — dans Stocks et Coûts, seul « Protéagineux en grain » apparaît : les
  tourteaux **n'y figurent pas**.
- `image016.png` — export CSV référentiel : la colonne `Stock_correspondant` (noire) vaut
  **RC** pour « Concentré céréales » mais est **vide pour les tourteaux** (colza, soja,
  …) → c'est pourquoi ils ne remontent pas dans les stocks.

### 1.2 La chaîne de remontée des concentrés vers STOCKS ET COUTS

La consommation d'un concentré remonte vers son code de stock via
`getBatchConcentratedConsumption` (`mixins.js` L651) :

```js
const feedsForPeriod = batch.concentratedFeeds.find(
  (item) => item.period.id === periodId,
).feeds;
const result = Object.values(feedsForPeriod).reduce((acc, curr) => {
  var calcul = 0;
  if (curr.type.correspondingStock === stockCode) {
    // ← comparaison par code de stock
    calcul = curr.quantity;
  }
  return acc + calcul;
}, 0.0);
```

Puis `getConsumptionByBarnStockItem` (L595) ne traite **que** `RC` et `RP` :

```js
switch (stockCode) {
  case 'RP':
  case 'RC':
    return getConsumptionForConcentrated(simulation, periods, stockCode)
  ...
}
```

Et `report.js` `getConcentratedFeedsStock` (L126) ne construit **que** les lignes
`RC` et `RP` :

```js
const stockCodeList = ["RC", "RP"];
```

**Conséquence** : un concentré dont `correspondingStock` est **vide** (tourteaux) :

1. `getBatchConcentratedConsumption(…, 'RP')` ne le compte **pas** (car
   `correspondingStock === '' ≠ 'RP'`) → sa quantité n'est attributée à **aucun** code.
2. Donc **aucune** ligne de STOCKS ET COUTS ne le reflète.

C'est exactement le symptôme de `image013` : les tourteaux distribués (0,35) ne
remontent nulle part.

### 1.3 Le référentiel : la colonne `Stock_correspondant`

CSV `fichier_aliments_concentres.csv` (extrait) :

```
"nom";"UFL";"UFV";"PDIN";"PDIE";"PDIinf";"stock_correspondant";"source"
"Concentré céréales";1.02;1.02;70;89;70;"RC";"..."
"Tourteau de colza";0.85;0.80;219;138;138;"";""          ← vide
"Tourteau de colza AB";0.96;0.90;180;110;110;"";"Partners and co"   ← vide
"Tourteau de soja";1.05;1.05;330;230;230;"";""          ← vide
"Tourteau de soja 42 AB";1.17;1.16;310;220;220;"";""    ← vide
"Luzerne déshydratée";0.63;0.55;109;94;94;"";""         ← vide
"Féverole Hiver AB";1;1;153;92;92;"RP";"..."           ← RP
"Lupin Blanc AB";1.13;1.12;205;101;101;"";""           ← vide
"Pois protéagineux AB";1.05;106;143;85;85;"RP";"..."    ← RP
"Céréales AB (azote défavorable)";0.97;0.97;55;81;55;"";""   ← vide
"Blé_pois (90% - 10 %) AB";0.99;0.99;67;84;67;"RC-RP";""  ← multiple
...
```

➡️ **Cause racine** : la colonne `stock_correspondant` est **vide pour les tourteaux**
(et d'autres concentrés : luzerne déshydratée, lupin, céréales AB, …). Le code de stock
cible n'étant pas renseigné, la consommation de ces concentrés n'est **attribuée à
aucune ligne** de STOCKS ET COUTS.

### 1.4 Résumé des causes racines

| #   | Cause                                                                                    | Où                                            | Impact                                                            |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| T1  | Colonne `stock_correspondant` vide pour les tourteaux (et d'autres concentrés)           | `referential/fichier_aliments_concentres.csv` | consommation des tourteaux non attribuée à aucun stock            |
| T2  | `getConsumptionByBarnStockItem` ne gère que `RC`/`RP` (pas d'autre code concentré)       | `mixins.js` L595                              | si on ajoute un code `RT`, il faudra l'ajouter au switch          |
| T3  | `getConcentratedFeedsStock` ne construit que les lignes `RC`/`RP`                        | `report.js` L126                              | si on ajoute un code `RT`, il faudra l'ajouter à `stockCodeList`  |
| T4  | Cas `stock_correspondant` **multiple** (`RC-RP`) non géré : aucun code ne matche `RC-RP` | `mixins.js` L651-656                          | les concentrés « Blé_pois » (50-50) ne remontent aussi nulle part |

---

## 2. Recommandations (plan de correction)

### 2.1 Choix d'option (à trancher avec l'équipe)

Le ticket propose deux options. **Préco : Option 1** (attribuer `RP`), **sauf si**
l'équipe veut une traçabilité dédiée des tourteaux (Option 2).

#### Option 1 — Attribuer `RP` aux tourteaux (recommandée, minimal)

**Principe** : dans le CSV référentiel, renseigner `stock_correspondant = RP` pour les
lignes « Tourteau ». Les tourteaux (matières premières protéiques) rejoignent le stock
« Protéagineux en grain » (RP), qui est le concentré protéique existant.

**Changements** :

1. `referential/fichier_aliments_concentres.csv` : mettre `RP` dans
   `stock_correspondant` pour :
   - Tourteau de colza, Tourteau de colza AB,
   - Tourteau de soja, Tourteau de soja 42 AB,
   - (à décider) Luzerne déshydratée, Lupin Blanc AB, Céréales AB (→ `RC` ?),
     pois protéagineux AB (déjà `RP`).
2. **Aucun changement de code** : `getBatchConcentratedConsumption` (comparaison par
   code), `getConsumptionByBarnStockItem` (switch `RP`), `getConcentratedFeedsStock`
   (`stockCodeList = ['RC','RP']`) **déjà** gèrent `RP`. Les tourteaux remontent
   automatiquement dans la ligne RP.
3. **Re-seeding** du référentiel (recharger le CSV en base).

**Avantages** : zéro code, zéro migration, aligné sur la sémantique existante (RP =
concentré protéique).
**Inconvénient** : les tourteaux ne sont **pas distingués** des autres protéagineux
dans STOCKS ET COUTS (tout RP est mélangé). Si INRAE veut suivre la consommation de
tourteaux séparément, ce n'est pas suffisant.

#### Option 2 — Créer une catégorie `RT` (tourteau) (plus propre, plus coûteux)

**Principe** : nouveau code de stock `RT` (T pour tourteau), nouvelle ligne dans
STOCKS ET COUTS.

**Changements** :

1. `referential/fichier_aliments_concentres.csv` : `stock_correspondant = RT` pour les
   tourteaux.
2. `referential.js` : ajouter `RT` dans `barnStockItems`
   (`{ code: 'RT', name: 'Tourteaux', unity: 'qtx', concentrated: true }`).
3. `mixins.js` `getConsumptionByBarnStockItem` (L595) : ajouter `case 'RT':` dans le
   switch (même branche `RP`/`RC`).
4. `report.js` `getConcentratedFeedsStock` (L126) : `stockCodeList = ['RC', 'RP', 'RT']`.
5. `report.js` state `soldedStock` : ajouter une entrée `RT`.
6. `barn.js` getter `initialStocks` (L43) : filtrer `RT` du filtre
   (`el.code !== 'STRAW' && el.code !== 'RP' && el.code !== 'RC' && el.code !== 'RT'`).
7. `Barn.vue` : champ de saisie du stock initial RT (comme RC/RP).
8. **Re-seeding** du référentiel.

**Avantages** : traçabilité dédiée des tourteaux (ligne séparée dans STOCKS ET COUTS).
**Inconvénient** : plus de points de contact (code + UI + state), à tester.

➡️ **Préco** : **Option 1** pour débloquer vite (les tourteaux remontent en RP),
**Option 2** si l'équipe/INRAE exige une ligne tourteaux dédiée. Le ticket 12 dit
explicitement « L'Option 2 est la plus propre mais impacte le référentiel + le calcul
des stocks + l'affichage » — à trancher en réunion.

### 2.2 Fix annexe — `stock_correspondant` multiple (`RC-RP`) (T4)

Indépendamment de l'option, les concentrés avec `stock_correspondant = RC-RP` (ex.
« Blé_pois 50-50 AB ») ne remontent **nulle part** (aucun code ne matche la chaîne
`RC-RP`). Deux sous-options :

- **2a (simple)** : dans le CSV, séparer en deux lignes (50 % RC + 50 % RP) ou choisir
  un code dominant ;
- **2b (général)** : faire `getBatchConcentratedConsumption` parser
  `correspondingStock.split('-')` et répartir la quantité (50/50 par défaut).

➡️ **Préco** : **2a** (côté CSV, pas de code) si le cas est rare ; **2b** si c'est
fréquent. À valider avec INRAE.

### 2.3 Tests à ajouter (`tests/unit/vuex/`)

- `stock.spec.js` (ou nouveau `concentrated.spec.js`) :
  - **Option 1** : concentré « Tourteau de colza » (`correspondingStock: 'RP'`)
    distribué → `getBatchConcentratedConsumption(…, 'RP')` > 0 et
    `getConcentratedFeedsStock` ligne RP non nulle ;
  - **Option 2** : concentré « Tourteau » (`correspondingStock: 'RT'`) → nouvelle ligne
    RT dans `getConcentratedFeedsStock` ;
  - **T4** : concentré `correspondingStock: 'RC-RP'` → (2a) ignoré / (2b) réparti 50/50 ;
  - **régression** : les concentrés `RC`/`RP` existants continuent de remonter
    correctement.

---

## 3. Fichiers impactés (récap)

| Fichier                                                          | Option 1               | Option 2                                            |
| ---------------------------------------------------------------- | ---------------------- | --------------------------------------------------- |
| `services/backend/referential/fichier_aliments_concentres.csv`   | `RP` sur les tourteaux | `RT` sur les tourteaux                              |
| `services/frontend/ui/src/store/modules/referential.js`          | —                      | ajouter `RT` dans `barnStockItems`                  |
| `services/frontend/ui/src/store/modules/mixins.js` (L595)        | —                      | `case 'RT':` dans le switch                         |
| `services/frontend/ui/src/store/modules/report.js` (L126, state) | —                      | `stockCodeList += ['RT']` + entrée `soldedStock.RT` |
| `services/frontend/ui/src/store/modules/barn.js` (L43)           | —                      | filtrer `RT` dans `initialStocks`                   |
| `services/frontend/ui/src/views/simulator/Barn.vue`              | —                      | champ stock initial RT                              |
| Re-seeding référentiel                                           | ✅                     | ✅                                                  |
| Tests unitaires                                                  | ✅                     | ✅                                                  |

> ⚠️ **Aucune migration de schéma** (la colonne `stock_correspondant` existe déjà sur
> `ConcentratedFeed`). Seul le **re-seeding du CSV** est nécessaire (Option 1 comme 2).
> L'Option 2 ajoute du code frontend mais pas de migration backend.

---

## 4. Critères d'acceptation

1. Un tourteau distribué (ex. « Tourteau de colza » 0,35) **apparaît dans STOCKS ET
   COUTS** :
   - Option 1 : dans la ligne « Protéagineux en grain » (RP) ;
   - Option 2 : dans une ligne dédiée « Tourteaux » (RT).
2. Les autres concentrés déjà attribués (RC, RP) **continuent** de remonter
   correctement (pas de régression).
3. (Annexe T4) les concentrés `RC-RP` (Blé_pois 50-50) remontent (répartis ou ignorés
   de façon documentée).
4. Le référentiel est re-seedé ; les tests unitaires passent.

## 5. Risques / points d'attention

- **Décision d'option** (1 vs 2) : à trancher avec l'équipe/INRAE avant implémentation.
  L'Option 1 est la plus rapide mais sans traçabilité dédiée.
- **Référentiel partagé** : le re-seeding du CSV affecte **tous** les workspaces qui
  chargent le référentiel — valider que les valeurs `RP`/`RT` choisies sont cohérentes
  avec l'usage INRAE.
- **Cas multiple `RC-RP`** (T4) : à ne pas oublier — c'est le même type de bug
  (concentré non remonté) que les tourteaux.
- **Lien avec le ticket 13** (réorganiser la liste de la Grange) : si Option 2
  (nouveau code `RT`), l'ordre des catégories de la Grange est impacté — traiter le
  ticket 13 en cohérence (la liste `barnStockItems` est la même source).

## 6. Estimation

| Bloc                                                        | Option 1    | Option 2   |
| ----------------------------------------------------------- | ----------- | ---------- |
| CSV + re-seeding                                            | ~0,25 j     | ~0,25 j    |
| Code frontend (referential, mixins, report, barn, Barn.vue) | —           | ~0,5 j     |
| Tests unitaires                                             | ~0,25 j     | ~0,5 j     |
| Annexe T4 (`RC-RP`, 2a simple)                              | ~0,25 j     | ~0,25 j    |
| **Total**                                                   | **~0,75 j** | **~1,5 j** |
