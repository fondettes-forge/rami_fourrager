# Cycle de vie des items — Rami (état actuel)

> Document de synthèse : pour chaque type d'item du Rami, son **cycle de vie** de bout
> en bout — **définition → création → production/saisie → consommation → stock →
> bilan (STOCKS ET COUTS) → coûts**.
> État du code au : 2026-11-17 (post tickets 1, 2+8, 3 §2.1, 4, 9, 13).
> Index des tickets : [tickets/INDEX.md](tickets/INDEX.md).
>
> **Lecture** : chaque item est décrit sur le même canevas. Les écarts entre items
> (ex. paille vs fourrages, tourteaux) sont signalés en **⚠️**.

---

## 0. Vue d'ensemble

Deux grandes familles d'items alimentaires, plus les pâtures :

| Famille | Codes de stock | Unité | Saisie dans le lot |
|---|---|---|---|
| **Fourrages** (cartes rations « classiques ») | `FH` `FL` `EH` `EM` `EL` `AS` `STRAW` | tMS (STRAW : t) | **proportion %** de la ration |
| **Concentrés** | `RC` `RP` | qtx | **quantité kg brut/animal/j** |
| **Pâtures** | `P` (pas un stock) | kgMS/ha/j | proportion % (pâturage) |

Le **lien central** entre un aliment et un stock est le champ
**`stock_correspondant`** (colonne `stock_correspondant` du référentiel, ou
`correspondingStock` d'une carte ration custom). C'est ce champ qui détermine **dans
quel stock** la consommation d'un aliment est comptabilisée.

**Mécanismes communs** (front-end, `store/modules/mixins.js` + `report.js`) :

1. **Définition** : référentiel CSV (backend) → synchronisé incrémentalement dans le
   store `referential.js` ; ou carte custom créée dans le workspace.
2. **Stock initial** : saisi dans la **Grange** (`Barn.vue`) → `initialStocks[code]`.
3. **Production** : calculée depuis l'**assolement** (baguettes × rendement) →
   `stockByPeriod` (par période) ; la paille fait exception (cf. §2.6).
4. **Consommation** : calculée par lot, par période, via `stock_correspondant`.
5. **Stock final** : `initial + production − consommation`
   (`getFinalStockByBarnStockItem`).
6. **Bilan** : lignes du tableau *STOCKS ET COUTS* (`getStockNcoastData` →
   `getClassicFeedsStock` / `getConcentratedFeedsStock` / `getStrawStock`).
7. **Coûts** : achat/vente/coût de production par code (`soldedStock[code]`).

---

## 1. Fourrages stockés (FH, FL, EH, EM, EL, AS)

C'est le cycle de référence, le plus abouti.

### 1.1 Définition
- **Référentielle** : ligne dans `fichier_type_ration.csv` (nom, 9 valeurs
  nutritionnelles, `stock_correspondant`). Ex. « Foin bonne qualité » → `FH`,
  « Ensilage de maïs/sorgho » → `EM`.
- **Custom** : carte ration créée dans *Mes configurations → Mes cartes rations*
  (`workspace.classicFeeds`), avec un `correspondingStock` choisi parmi les codes.
  (cf. [ticket 1](tickets/ticket-1-carte-ration-introuvable.md).)

### 1.2 Création / saisie
- Référentielle : chargée depuis l'API (synchronisation incrémentale par
  `lastConnectionDate`).
- Custom : formulaire `ClassicFeedModal.vue` (nom + stock correspondant + valeurs
  nutritionnelles), validé (`correspondingStock` doit exister).

### 1.3 Stock initial
- Saisi dans la **Grange** (table des stocks, `initialStocks[code].quantity`), en **tMS**.

### 1.4 Production
- Calculée par `dispatchProductionByPeriod` : pour chaque baguette de l'assolement,
  `production (tMS/ha) × surface` par période, groupée par `farming_method` (= code
  de stock). Stockée dans `barn.stockByPeriod[période].stock[]`.

### 1.5 Consommation
- Saisie dans le lot : **proportion %** de la ration (`batch.classicFeeds`).
- Calcul : `proportion % × besoinMS (kgMS/animal/j)` → `getBatchConsumption`
  (comparaison `type.correspondingStock === code`) → `getConsumptionForOthers`.
  Multipliée par le nombre d'animaux × jours, `/1000` (kg→tMS).

### 1.6 Stock final
- `getFinalStockByBarnStockItem` : `initial + production − consommation`.

### 1.7 Bilan & coûts
- Ligne dans *STOCKS ET COUTS* via `getClassicFeedsStock` (catégorie `1_fourrage`) :
  nom, stock initial, production, consommation, stock final, achat.
- Coûts via `soldedStock[code]` (purchaseCost, sale, costOfSell, productionCost).
- Apparaît dans le graphique « Évolution des stocks » (`getStockEvolution`).

**Traçabilité : complète** (définition → stock → conso → bilan → coûts).

---

## 2. Paille (STRAW)

⚠️ **Cycle hybride** : code de stock dédié, mais géré **partiellement à part** des
autres stocks. (cf. [ticket 2](tickets/ticket-2-paille-stocks-couts.md) /
[ticket 8](tickets/ticket-8-paille-aucune-conso.md).)

### 2.1 Définition
- Ligne référentielle « **Paille** » dans `fichier_type_ration.csv` avec
  `stock_correspondant = STRAW` (ajout ticket 2/8).
- Custom : comme tout fourrage (carte ration `correspondingStock = STRAW`).

### 2.2 Stock initial
- ⚠️ **Champ dédié** dans la Grange (« Stock de paille disponible au 1er janvier »),
  **pas** une ligne du tableau des stocks. Unité : **tonnes** (ticket 3).
- ⚠️ La table des stocks de la Grange **filtre explicitement** `STRAW` (et RC/RP)
  hors de la liste affichée (`barn.js` getter `initialStocks`).
- ⚠️ Migration kg→t à la charge (`setBarn`, seuil > 1000) — ticket 3.

### 2.3 Production
- ⚠️ **Calcul dédié** `setTotalStrawStock` : somme, sur les baguettes de
  l'assolement, `rendement paille (kg/ha) × surface / 1000` (t). Le rendement paille
  vient de la colonne `Rdt_paille` du référentiel baguettes, mappée sur
  `Stic.rendement`. **Pas** par le mécanisme `stockByPeriod` des autres stocks.

### 2.4 Consommation — **deux sorties**
- **Paille alimentation** : `getConsumptionForOthers(sim, 'STRAW')` — la paille
  distribuée comme aliment (proportion %, comme un fourrage).
- **Paille logement (litière)** : `getConsumptionOfNonFoodStraw` —
  `straw_requirement (kg/UGB/j) × UGB du lot × jours / 1000` (t). Calculée
  automatiquement selon le type de logement et la présence, **sans** saisie.

### 2.5 Stock final
- `initial + production − (conso aliment + conso logement)`
  (`getFinalStockByBarnStockItem`, cas `STRAW`).

### 2.6 Bilan & coûts
- ⚠️ **Deux sous-lignes** dans *STOCKS ET COUTS* (`getStrawStock`, catégorie
  `3_straw`) :
  - *Paille (alimentation)* — porte stock initial, production, stock final ;
  - *Paille (logement)* — porte la consommation litière ;
  - + une **ligne cachée de synthèse** (totaux, coûts, export) → pas de double
    comptage.
- ⚠️ **Coûts non séparés** aliment/logement : un seul jeu `soldedStock['STRAW']`.
- Apparaît dans le graphique « Évolution des stocks » (`getStockEvolution` inclut
  `STRAW`).

**Traçabilité : partielle.** Distinction aliment/logement **oui** (dans le bilan) ;
mais production/stock initial par un chemin dédié et coûts globaux → pas une
catégorie « à part entière » comme le cycle de référence.

---

## 3. Concentrés (RC, RP)

### 3.1 Définition
- Lignes dans `fichier_aliments_concentres.csv` (nom, UFL/UFV/PDIN/PDIE/PDIinf,
  `stock_correspondant`).
- ⚠️ **Pas de cartes custom concentrées** de la même manière que les fourrages :
  les concentrés proviennent du référentiel. (Le fix C3 du ticket 1 corrige la
  fusion de la liste affichée, mais la création custom concentrée n'est pas un flux
  produit.)

### 3.2 Stock initial
- Saisi dans la Grange via **champs dédiés** : « Stock de concentrés énergétiques »
  (`RC`) et « protéiques » (`RP`), en **qtx**. (⚠️ pas dans le tableau des stocks,
  qui les filtre.)

### 3.3 Production
- ⚠️ **Partielle** : `dispatchProductionByPeriod` produit les récoltes grain en
  `qtx/ha` (commentaire « pour récoltes grain : qtx/ha »). La production grain
  alimente `RC`/`RP` dans `stockByPeriod`.

### 3.4 Consommation
- Saisie dans le lot : **quantité en kg brut/animal/j** (`batch.concentratedFeeds`),
  **pas** une proportion %.
- Calcul : `getBatchConcentratedConsumption` (somme des quantités dont
  `correspondingStock === code`) × nb animaux × jours, `/100` (kg→**qtx**)
  (`getConsumptionForConcentrated`).

### 3.5 Stock final
- `initial + production − consommation` (même formule que les fourrages).

### 3.6 Bilan & coûts
- Lignes via `getConcentratedFeedsStock` (catégorie `2_concentrated`), en **qtx**.
- Coûts via `soldedStock[code]`.
- ⚠️ **Non intégrés au graphique** « Évolution des stocks » (`getStockEvolution`
  liste `['FH','EH','EM','EL','FL','AS','STRAW']` — RC/RP absents) et filtrés du
  tableau Grange.

**Traçabilité : partielle.** Bilan + coûts OK (en qtx) ; production/partie stock et
affichage graphique incomplets. (Option de passage en tonnes →
[backlog BL-1](tickets/BACKLOG.md).)

### 3.7 ⚠️ Cas des tourteaux (colza, soja, …) — **non abouti** (ticket 12)
- Dans `fichier_aliments_concentres.csv`, les lignes « Tourteau de colza/soja »,
  « Luzerne déshydratée », « Lupin », « Céréales AB » ont **`stock_correspondant`
  vide** → elles sont **distribuables** dans le lot mais **ne remontent dans aucun
  stock** (ni RC, ni RP) → **absentes de STOCKS ET COUTS**.
- Seules « Féverole »/« Pois » (`RP`) et « Concentré céréales »/« Blé_pois »
  (`RC`/`RC-RP`) remontent.
- **À trancher** ([ticket 12](tickets/ticket-12-tourteaux-stocks-couts.md)) :
  - **Option 1** : attribuer `RP` aux lignes tourteau (CSV seul, rapide) ;
  - **Option 2** : créer une catégorie `RT` (tourteau) + ligne dédiée (traçabilité
    de bout en bout, propre).

---

## 4. Pâtures (P)

⚠️ **Pas un stock** : la pâture n'a pas de stock initial ni de stock final — elle est
**pâturée sur place** par période.

### 4.1 Définition
- Types de pâture dans `fichier_type_pature.csv` + ligne « Pâture » dans
  `fichier_type_ration.csv` (`stock_correspondant = P`).
- ⚠️ **Ticket 14** (à clarifier) : les valeurs alimentaires des pâtures pourraient
  être déclinées VL/VA — en attente de décision INRAE.

### 4.2 Production
- `getPastureProductionTotal` : production pâture par période
  (`totalAvailablePastureByPeriod`), en `kgMS/ha/j × jours`, `/1000` (tMS).

### 4.3 Consommation
- `getTotalPastureConsumption` : selon la répartition des lots en pâturage par
  période, × nb animaux × jours, `/1000` (tMS).

### 4.4 Stock final
- ⚠️ **Pas de stock** : `getPastureFinalStock = production − consommation`
  (surplus/perte de pâture), pas de stock initial.

### 4.5 Bilan & coûts
- Traité à part dans le dimensioning / bilan (autonomie, potentialité), pas comme une
  ligne de stock classique.

**Traçabilité : spécifique** (cycle « production ↔ pâturage », sans stock).

---

## 5. Matrice synthèse de traçabilité

| Item | Définition | Stock initial | Production | Conso aliment | Conso logement | Stock final | Bilan (STOCKS/COUTS) | Coûts | Traçabilité |
|---|---|---|---|---|---|---|---|---|---|
| FH/FL/EH/EM/EL/AS | ✅ | ✅ Grange (table) | ✅ stockByPeriod | ✅ proportion | — | ✅ | ✅ 1 ligne | ✅ | **complète** |
| STRAW (paille) | ✅ | ⚠️ champ dédié (t) | ⚠️ calc dédié | ✅ proportion | ✅ automatique | ✅ | ✅ 2 sous-lignes | ⚠️ global | **partielle** |
| RC/RP (concentrés) | ✅ | ⚠️ champs dédiés (qtx) | ⚠️ partielle (qtx/ha) | ✅ kg/an/j | — | ✅ | ✅ 1 ligne (qtx) | ✅ | **partielle** |
| Tourteaux | ✅ | ❌ (stock_correspondant vide) | ❌ | ✅ distribués | — | ❌ | ❌ absents | ❌ | **non aboutie** (ticket 12) |
| P (pâture) | ✅ | ❌ (pas de stock) | ✅ | ✅ pâturage | — | ⚠️ prod−conso | ⚠️ à part | ⚠️ | **spécifique** |

---

## 6. Points d'attention transverses (rappel tickets)

- **Ticket 12** (⚠️ haute) : les tourteaux ont une traçabilité **non aboutie** —
  décision Option 1 (`RP`) / Option 2 (`RT`) à trancher.
- **Ticket 14** (⏳) : valeurs pâtures VL/VA à clarifier avec INRAE.
- **Backlog BL-1** : passage des céréales/protéagineux en tonnes (unité RC/RP).
- **Paille** : si on veut une traçabilité « catégorie à part entière » (comme une
  Option 2), il faudrait uniformiser la production/stock au cycle standard et
  séparer les coûts aliment/logement — travail distinct du ticket 12.
