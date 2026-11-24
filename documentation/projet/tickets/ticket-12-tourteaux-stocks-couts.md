# Ticket 12 — Concentrés : tourteaux (colza, soja, …) absents de Stocks et Coûts

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §12.
> Statut : **✅ Implémenté (Option 2 — RT)**
> · Priorité : **haute** · Type : nouveauté
> Seche lié : ticket **1** (cartes custom distribuable — nécessaire pour que les cartes
> tourteaux custom remontent aussi) · ticket **13** (ordre des stocks Grange, même source
> `barnStockItems`)
> Date de l'analyse : 2026-11-16 · Implémenté : 2026-11-24

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

### 2.1 Choix d'option — **Option 2 tranchée (2026-11-18)**

> **Décision** : l'**Option 2 (catégorie dédiée `RT`)** est retenue, pour une
> **traçabilité de bout en bout** des tourteaux (même logique que la paille, qui a
> obtenu sa propre ligne/stock). L'Option 1 (`RP`) est abandonnée.
>
> **Conséquence** : les §2.1 (Option 1) et §2.1 (Option 2) ci-dessous servent de
> référence ; la **spécification actionnable** de l'Option 2 est dans le **§2.4**.

Le ticket proposait deux options :

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

➡️ **Préco d'origine** (dépasse) : Option 1 pour débloquer vite, Option 2 si traçabilité
exigée. **→ tranché : Option 2.**

### 2.2 Spécification de l'Option 2 (RT) — à implémenter (décision 2026-11-18)

> Traçabilité de bout en bout : le tourteau devient un **stock à part entière**
> (`RT`), du référentiel jusqu'à la ligne dédiée de STOCKS ET COUTS — même logique que
> la paille (`STRAW`). Aucune migration de schéma (la colonne
> `stock_correspondant` existe déjà) ; seul le **re-seeding du CSV** est requis.

#### 2.2.1 Définition du code `RT`

| Champ          | Valeur      | Justification                                                                                                                                                                          |
| -------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`         | `RT`        | T pour tourteau (demande du mail)                                                                                                                                                      |
| `name`         | `Tourteaux` | libellé de la ligne STOCKS ET COUTS                                                                                                                                                    |
| `unity`        | `qtx`       | **même unité que RC/RP** (les concentrés sont saisis en kg/animal/j puis convertis en qtx par `/100` dans `getBatchConcentratedConsumption`) — cohérence avec le groupe « concentrés » |
| `concentrated` | `true`      | flag existant qui pilote le chip « concentré » de la table Grange (`Barn.vue` `getColor`) et le regroupement du groupe `2_concentrated`                                                |

> ⚠️ **Unité** : garder `qtx` (pas `t`). Le passage en tonnes des céréales/protéagineux
> est le **backlog BL-1** (ticket 3 §2.2), hors périmètre ici — `RT` suivra la même
> unité que RC/RP, et bénéficiera de BL-1 si celui-ci est fait.

#### 2.2.2 Étape 1 — Référentiel (CSV + re-seed)

`services/backend/referential/fichier_aliments_concentres.csv` : renseigner
`stock_correspondant = RT` pour les lignes tourteaux :

- Tourteau de colza
- Tourteau de colza AB
- Tourteau de soja
- Tourteau de soja 42 AB

> **À valider avec INRAE** : les autres concentrés dont la colonne est **vide**
> (Luzerne déshydratée, Lupin Blanc AB, Pois protéagineux AB, Céréales AB (azote
> défavorable), …) — les laisser vides (hors périmètre tourteau) ou les rattacher
> (luzerne/lupin/pois → `RT` ? pois → déjà `RP`). Le périmètre minimal du ticket est
> les **tourteaux** ; le reste est à clarifier.

Puis **re-seeding** du référentiel `ConcentratedFeed` (recharger le CSV en base).

#### 2.2.3 Étape 2 — Store frontend (4 points de contact)

1. **`referential.js` — `barnStockItems`** (L41-54) : ajouter l'entrée `RT`
   **après `RP`** (L51) et **avant `AS`** (L52), pour regrouper les 3 concentrés
   (RC, RP, RT) avant l'« autre stock » :
   ```
   { code: 'RT', name: 'Tourteaux', unity: 'qtx', concentrated: true, color: '' }
   ```
   > Cet ordre est aussi celui de la liste des types de stock de la Grange — voir
   > impact **ticket 13** (§2.2.6).
2. **`mixins.js` — `getConsumptionByBarnStockItem`** (switch L591) : ajouter
   `case 'RT':` dans la **même branche** que `case 'RP':` / `case 'RC':`
   (→ `getConsumptionForConcentrated(simulation, periods, 'RT')`).
3. **`report.js` — `getConcentratedFeedsStock`** (L126) :
   - `stockCodeList = ['RC', 'RP', 'RT']` (L133) ;
   - **state `soldedStock`** (L42-53) : ajouter l'entrée
     `RT: { purchaseCost: 0, sale: 0, costOfSell: 0, productionCost: 0 }`
     (sinon `state.soldedStock['RT']` est `undefined` → crash sur les coûts).
4. **`barn.js` — getter `initialStocks`** (L54-56) : le filtre actuel
   `el.code !== 'STRAW' && el.code !== 'RP' && el.code !== 'RC'` **doit exclure aussi
   `RT`** (sinon le stock initial RT apparaîtrait dans la table générique des stocks
   fourragers **et** dans le champ concentré → double affichage).

#### 2.2.4 Étape 3 — UI `Barn.vue` (saisie stock initial)

La section « Concentrés » de la Grange (L33-45) a **deux** champs saisis en dur :
`energeticQuantity` (→ `RC`, L272) et `proteicQuantity` (→ `RP`, L285), chacun mappé
sur `getInitialStockQuantityByCode('RC'/'RP')` + commit de l'`initialStock`.

- Ajouter un **troisième champ** `tourteauxQuantity` (→ `RT`), identique aux deux
  existants (label i18n `barn.concentrated.tourteauxQuantity`, getter/commit en `RT`).
- La table des stocks (L76, `:items="initialStocks"`) n'affichera **pas** RT une fois
  le filtre §2.2.3.4 appliqué → RT est saisi uniquement dans le champ dédié, comme
  RC/RP.
- Le select « stock correspondant » des **cartes rations** (`:items="barnStockItems"`,
  L123) inclura automatiquement `RT` → une carte ration tourteau pourra pointer sur
  `RT` (lien ticket 1).

#### 2.2.5 Étape 4 — i18n `fr.json`

- `barn.concentrated.tourteauxQuantity` : « Quantité de tourteaux au 1er janvier ».
- (libellé de ligne STOCKS ET COUTS fourni par `barnStockItems.name` = « Tourteaux »).

#### 2.2.6 Impact sur le ticket 13 (ordre Grange) — à trancher

`barnStockItems` est la **même source** pour la liste des types de stock de la Grange
(ticket 13, ordre : FH, FL, EH, EM, EL, RC, RP, AS, STRAW). L'ajout de `RT` change cet
ordre. **Position retenue** : `RT` **après `RP`** (regroupe les concentrés RC/RP/RT
avant « autre stock ») :

```
FH, FL, EH, EM, EL, RC, RP, RT, AS, STRAW
```

➡️ À confirmer avec Antoine (il avait imposé un ordre précis sur le ticket 13) ; mettre
à jour le ticket 13 + la recette en cohérence.

#### 2.2.7 Tests à ajouter (`tests/unit/vuex/`)

- **Option 2** : concentré « Tourteau de colza » (`correspondingStock: 'RT'`) distribué
  → `getBatchConcentratedConsumption(…, 'RT')` > 0 et `getConcentratedFeedsStock`
  renvoie une **ligne RT** non nulle (catégorie `2_concentrated`) ;
- **stock initial RT** : `initialStocks` (getter barn) **n'inclut pas** RT ; le champ
  `RT` remonte dans `getInitialStockByBarnStockItem` ;
- **coûts RT** : `soldedStock.RT` initialisé → pas de crash sur les coûts de la ligne
  RT ;
- **régression** : les concentrés `RC`/`RP` existants continuent de remonter
  correctement (RC ≠ RP ≠ RT, pas de mélange) ;
- **annexe T4** : voir §2.3.

#### 2.2.8 Critères d'acceptation (Option 2)

1. Un tourteau distribué (ex. « Tourteau de colza » 0,35) apparaît dans une **ligne
   dédiée « Tourteaux » (RT)** de STOCKS ET COUTS (groupe « Les concentrés »).
2. Le stock initial RT est saisissable dans la Grange (champ dédié, en qtx).
3. RC, RP continuent de remonter correctement (pas de régression, pas de mélange).
4. `barnStockItems` contient `RT` (concentrated, qtx) ; la table des stocks n'affiche
   pas RT (fiche filtrée) ; le select « stock correspondant » propose RT.
5. Référentiel re-seedé ; tests unitaires passent.

### 2.3 Fix annexe — `stock_correspondant` multiple (`RC-RP`) (T4)

> **Hors périmètre de l'Option 2** (traçabilité tourteaux) — mais c'est le **même type
> de bug** (concentré non remonté) : les concentrés avec `stock_correspondant = RC-RP`
> (ex. « Blé_pois 50-50 AB ») ne remontent **nulle part** (aucun code ne matche la
> chaîne `RC-RP`). Deux sous-options :

- **2a (simple)** : dans le CSV, séparer en deux lignes (50 % RC + 50 % RP) ou choisir
  un code dominant ;
- **2b (général)** : faire `getBatchConcentratedConsumption` parser
  `correspondingStock.split('-')` et répartir la quantité (50/50 par défaut).

➡️ **Préco** : **2a** (côté CSV, pas de code) si le cas est rare ; **2b** si c'est
fréquent. À valider avec INRAE. **À traiter séparément** (ne pas mélanger avec le
commit Option 2).

### 2.4 Tests à ajouter (`tests/unit/vuex/`)

> Détails dans **§2.2.7** (Option 2 retenue) et **§2.3** (annexe T4). Fichier :
> `tests/unit/vuex/concentrated.spec.js` (nouveau) ou `stock.spec.js` existant.

- **Option 2 (RT)** : ligne RT non nulle dans `getConcentratedFeedsStock`, stock initial
  RT filtré de `initialStocks`, coûts `soldedStock.RT` initialisés, régression RC/RP.
- **T4** : concentré `RC-RP` → (2a) ignoré / (2b) réparti 50/50 (selon la décision).

---

## 3. Fichiers impactés (récap — Option 2 retenue)

| Fichier                                                          | Changement (Option 2)                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| `services/backend/referential/fichier_aliments_concentres.csv`   | `stock_correspondant = RT` sur les 4 lignes tourteaux               |
| `services/frontend/ui/src/store/modules/referential.js` (L51)    | `RT` dans `barnStockItems` (après RP, avant AS ; qtx, concentrated) |
| `services/frontend/ui/src/store/modules/mixins.js` (switch L591) | `case 'RT':` dans la branche RC/RP                                  |
| `services/frontend/ui/src/store/modules/report.js` (L42, L133)   | état `soldedStock.RT` + `stockCodeList = ['RC','RP','RT']`          |
| `services/frontend/ui/src/store/modules/barn.js` (L55)           | filtre `initialStocks` : exclure aussi `RT`                         |
| `services/frontend/ui/src/views/simulator/Barn.vue` (L33-45)     | 3e champ concentré `tourteauxQuantity` (RT)                         |
| `services/frontend/ui/src/locales/fr.json`                       | `barn.concentrated.tourteauxQuantity`                               |
| **Re-seeding référentiel**                                       | ✅ (recharger le CSV en base)                                       |
| **Tests unitaires**                                              | ✅ (`tests/unit/vuex/concentrated.spec.js`)                         |

> ⚠️ **Aucune migration de schéma** (la colonne `stock_correspondant` existe déjà sur
> `ConcentratedFeed`). Seul le **re-seeding du CSV** est nécessaire.
> **Impact ticket 13** : l'ordre de la Grange passe à
> `FH, FL, EH, EM, EL, RC, RP, RT, AS, STRAW` (à confirmer, §2.2.6).

---

## 4. Critères d'acceptation

> Détail dans **§2.2.8** (Option 2 retenue).

1. Un tourteau distribué (ex. « Tourteau de colza » 0,35) apparaît dans une **ligne
   dédiée « Tourteaux » (RT)** de STOCKS ET COUTS (groupe « Les concentrés »).
2. Le stock initial RT est saisissable dans la Grange (champ dédié, en qtx).
3. Les autres concentrés (RC, RP) **continuent** de remonter correctement (pas de
   régression, pas de mélange).
4. (Annexe T4, §2.3) les concentrés `RC-RP` (Blé_pois 50-50) remontent de façon
   documentée (à traiter séparément).
5. Le référentiel est re-seedé ; les tests unitaires passent.

## 5. Risques / points d'attention

- **Option 2 tranchée** (2026-11-18) — plus de décision d'option ; reste à implémenter.
- **Référentiel partagé** : le re-seeding du CSV affecte **tous** les workspaces qui
  chargent le référentiel — valider que la valeur `RT` est cohérente avec l'usage INRAE,
  et trancher le rattachement des autres concentrés vides (luzerne, lupin, pois, …).
- **Cas multiple `RC-RP`** (T4, §2.3) : même type de bug (concentré non remonté) —
  **à traiter séparément**, ne pas mélanger avec le commit Option 2.
- **Lien avec le ticket 13** : l'ajout de `RT` change l'ordre de la Grange
  (`…RC, RP, RT, AS, STRAW`) — mettre à jour le ticket 13 + la recette en cohérence
  (même source `barnStockItems`).

## 6. Estimation (Option 2 retenue)

| Bloc                                                        | Effort      |
| ----------------------------------------------------------- | ----------- |
| CSV + re-seeding                                            | ~0,25 j     |
| Code frontend (referential, mixins, report, barn, Barn.vue) | ~0,5 j      |
| i18n + tests unitaires                                      | ~0,5 j      |
| **Total (Option 2)**                                        | **~1,25 j** |
| Annexe T4 (`RC-RP`, à traiter séparément)                   | ~0,25 j     |

## 7. Implémentation (2026-11-24)

**Option 2 (RT) implémentée** — m'insère dans l'existant (même logique que `STRAW`,
aucune migration de schéma, aucun nouveau pattern) :

- **Référentiel** : `fichier_aliments_concentres.csv` (gitignored) —
  `stock_correspondant = RT` sur les 4 lignes tourteaux (colza, colza AB, soja,
  soja 42 AB). **Re-seed du référentiel `ConcentratedFeed` à faire** en base.
  > Les autres concentrés à `stock_correspondant` vide (luzerne, lupin, pois, …)
  > laissés vides (périmètre minimal = tourteaux) — à trancher avec INRAE.
- **`referential.js`** : `RT` ajouté dans `barnStockItems` (après `RP`, avant `AS` ;
  `qtx`, `concentrated: true`). Ordre : `FH, FL, EH, EM, EL, RC, RP, RT, AS, STRAW`.
- **`mixins.js`** : `case 'RT':` ajoutée dans la branche `RC`/`RP` du switch
  `getConsumptionByBarnStockItem`.
- **`report.js`** : `soldedStock.RT` initialisé + `stockCodeList = ['RC','RP','RT']`
  dans `getConcentratedFeedsStock`.
- **`barn.js`** : filtre `initialStocks` exclut aussi `RT` (comme STRAW/RC/RP).
- **`Barn.vue`** : 3e champ `tourteauxQuantity` (→ `RT`), même pattern que RC/RP.
- **`fr.json`** : `barn.concentrated.tourteauxQuantity`.
- **Tests** : `tests/unit/vuex/concentrated.spec.js` (nouveau) — 8 tests : RT dans
  `barnStockItems` (position + attributs), consommation RT (mixins), ligne RT dans
  `getConcentratedFeedsStock`, `soldedStock.RT` initialisé, `case RT` dans
  `getConsumptionByBarnStockItem`, `initialStocks` exclut RT, régression RC/RP.

**Annexe T4** (`RC-RP`, §2.3) : **non traitée** (à valider avec INRAE — 2a CSV ou
2b parsing `split('-')`), à traiter séparément.

**Tests** : 8/8 ✅ (`concentrated.spec.js`) ; 30/30 avec referential + straw.
