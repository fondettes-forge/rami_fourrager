# Le Bilan — état des lieux + avis d'expert fourrager

> Document dédié au bloc **5. Le Bilan** de
> [synthese-exploitation-simulee.md](synthese-exploitation-simulee.md) :
> **(a)** l'existant (formules réelles, fonctions de code, limites observées),
> **(b)** l'avis d'expert (ingénieur agronome / conseiller fourrage chambre
> d'agriculture) : ce qui est solide, ce qui pose problème, et ce qu'il serait
> intéressant d'ajouter.
> État du code : 2026-11-18.
> Compléments : [synthese-agronomique.md](synthese-agronomique.md) §5, §8,
> [cycle-de-vie-des-items.md](cycle-de-vie-des-items.md),
> [../../projet/tickets/INDEX.md](../../projet/tickets/INDEX.md).

**Lecture** :

- **§1** = inventaire de l'existant (formules réelles, fonctions de code).
- **§2** = points d'attention constatés dans le code (faits techniques).
- **§3** = verdict global de l'expert.
- **§4** = points bloquants (à corriger ou à justifier) — P1.
- **§5** = points de fond à améliorer — P2.
- **§6** = ajouts recommandés — P3 (c'est là que l'outil devient réellement utile).
- **§7** = synthèse priorisée.
- **§8** = références internes.

---

## 1. Le Bilan — ce qu'il contient (inventaire)

La page _Bilan_ (onglets **Stocks et coûts | Travail | Bilan Global** — ticket 9)
comporte 4 composantes calculées :

| Composante                  | Fonctions                                                                                                     | Rôle                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Tableau STOCKS ET COUTS** | `getPastureStock`, `getClassicFeedsStock`, `getConcentratedFeedsStock`, `getStrawStock` (getters `report.js`) | le compte physique : initial + production − conso = final, achats |
| **Coûts**                   | `getCostIndicator` (`mixins.js` L753)                                                                         | coûts déclinés par unité de référence                             |
| **KPI**                     | `getCostIndicatorsKpis` (`mixins.js` L872)                                                                    | coût total fourrages + concentrés ; part des concentrés           |
| **Dimensionnement**         | `getDimensioning` (`report.js` L251) → E6–E9, autonomie, potentiel, fourrages récoltés                        | le compte du système en UGB                                       |

Affichées dans `StockTable.vue` (table + saisie des coûts par code) et
`CostIndicatorModal.vue` (indicateurs économiques + export CSV).

### 1.1 Tableau « STOCKS ET COUTS »

**Lignes** — 3 groupes (+ la pâture) :

| Groupe           | Stocks                                                                    | Getter                                    |
| ---------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| `1_fourrage`     | pâture `P`, FH, FL, EH, EM, EL (+ AS)                                     | `getPastureStock`, `getClassicFeedsStock` |
| `2_concentrated` | RC, RP                                                                    | `getConcentratedFeedsStock`               |
| `3_straw`        | Paille (alimentation), Paille (logement), + ligne cachée synthèse `STRAW` | `getStrawStock`                           |

**Colonnes** (par ligne) :

```
initialStock | production | consommation | finalStock
final_initialStock (final − initial) | purchase (si final < initial)
+ coûts saisis : purchaseCost, sale, costOfSell, productionCost
+ total (calculé)
```

**Formules** (`mixins.js`) :

- **Stock final** — `getFinalStockByBarnStockItem` (L614) :
  `initial + production − consommation` (formule identique pour STRAW ;
  le `if/else` fait deux fois pareil).
- **Surplus/déficit** — `getFinalMinInitialStockByBarnStockItem` (L633) :
  `final − initial`.
- **Achat** — `getPurchaseValueByBarnStockItem` (L643) :
  `max(0, −(final − initial))` — c'est-à-dire « tout ce qui manque ».
- **Production** — `getSticProductionByBarnStockItem` (L543) : somme des
  productions des baguettes du code, toutes périodes.
- **Consommation** — `getConsumptionByBarnStockItem` (L590) :
  - fourrages & paille : `getConsumptionForOthers` (L557) →
    `Σ lots Σ périodes conso/animal/j × nb × 28j / 1000`,
    **× (1 + refusalRate/100)** (les refus augmentent la conso effective) ;
  - concentrés : `getConsumptionForConcentrated` (L570) →
    `Σ kg/animal/j × nb × 28j / 100` ;
  - paille : `getConsumptionForStraw` (L583) = aliment (rations, code `STRAW`)
    - logement (via `getHousingStrawConsumption`).

**Le « total » coût par ligne** (`StockTable.vue` → `totalCost`, L173) :

| Catégorie                       | Formule                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| Pâture (`1_fourrage`, code `P`) | `conso × productionCost + achat × purchaseCost − vente × costOfSell`      |
| Fourrages stockés & paille      | `production × productionCost + achat × purchaseCost − vente × costOfSell` |
| Concentrés                      | `achat × purchaseCost + vente × costOfSell`                               |

### 1.2 Coûts — `getCostIndicator` (L753)

Les coûts de chaque groupe sont déclinés **par unité de référence** :

| Clé de coût       | Base du dénominateur                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| **/ ha SFP**      | `SFP` (`getSFP`, L929 — surfaces dont le code baguette commence par `P`) |
| **/ tMS**         | fourrages : `production + conso pâture` ; concentrés : `production`      |
| **/ UGB**         | `x647` = `getUGBSystem` (voir 1.4)                                       |
| **/ ha cultivé**  | `SAU − SFP` (L800)                                                       |
| **/ VL**          | nombre de vaches laitières                                               |
| **/ 1000 L**      | production laitière des VL (`milk_product_kg × count`)                   |
| **/ ha** (paille) | `getStrawSurface`                                                        |

- **Variantes** : « **sans** » (coût de production interne) vs « **avec** »
  (`o39`/`o44`/`o47` = somme des `total` des lignes, achats et ventes inclus) —
  cf. `getCostIndicators` (L372) qui assemble les 4 groupes.
- **KPI** — `getCostIndicatorsKpis` (L872) :
  `totalCost = Σ fourrages + Σ concentrés` ;
  `concentratedPart = concentrés / totalCost × 100`.
- **Note** : dans `getCostIndicator`, les deux variantes « with.tms » /
  « with.milleLitre » des fourrages sont marquées **`// probleme`** dans le code
  (L832, L835).

### 1.3 Paille — cas particulier

- `getStrawStock` (L161) renvoie **3 lignes** : `Paille (alimentation)`,
  `Paille (logement)` (sous-ligne, initial/production/final tous à 0 — le
  solde physique est porté par la ligne alimentation), et une **ligne cachée**
  `paille` (`hidden: true`) qui porte les totaux du groupe pour les coûts et
  l'export (tickets 2/8).
- Le coût de la paille dans `getCostIndicator` (L814) est
  `production × productionCost` de la ligne 0 du groupe uniquement
  (`strawCoutProd`) — le `total` de la ligne cachée n'est **pas** utilisé.

### 1.4 Dimensionnement — E6–E9, autonomie, potentiel

**Base commune** — `getV647` (L910) : consommation annuelle en tMS
**hors concentrés** (pâture consommée `getTotalPastureConsumption` + stocks
distributés de `stockCodeList = ['FH','EH','EM','EL','FL']`) ;

**`getUGBSystem`** (L951) = `V647 / 4,75` → « UGB nourri » (x647).

| Indicateur                    | Fonction                                 | Formule                                                 |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| Total troupeau                | `getTotalHerd` (L937)                    | `Σ lots count × (age_mois/12 si GEN, sinon 1)`          |
| UGB nourri                    | `getUGBSystem`                           | `V647 / 4,75`                                           |
| UGB à nourrir (objectif)      | `getUGBtoFeed` (L969)                    | `Σ périodes [besoinMS × nb × 28 / 1000] / 4,75`         |
| **E6 — Chargement SAU**       | `getEstimatedLivestockDensities` (L978)  | `UGB_nourri / SAU`                                      |
| **E7 — Chargement apparent**  | `getApparentLivestockDensities` (L988)   | `UGB_nourri / SFP`                                      |
| **E8 — Chargement corrigé**   | `getCorrectedLivestockDensities` (L1000) | `(UGB_nourri + (surplus − achat + vente) / 4,75) / SFP` |
| **E9 — Chargement potentiel** | `getPotentialLivestockDensities` (L1023) | `(Σ prod FH/EH/EM/EL/FL + prod pâture) / 4,75 / SFP`    |
| **Autonomie**                 | `getAutonomy` (L1037)                    | `E8 − E7` (> 0 → « autonome »)                          |
| **Potentiel réalisé**         | `getPotential` (L1044)                   | `E8 / E9 × 100` (≥ 90 % → « au potentiel »)             |
| Fourrages récoltés            | `getHarvestedFodder` (L1053)             | `Σ prod stocks / UGB_nourri` (tMS/UGB)                  |
| Ratios surfaces               | `getSFP_SAU`, `getPP_SAU`, `getPT_SAU`   | % SAU                                                   |

**Stoque & affichage** : `report.soldedStock[code]` (coûts saisis) + tous les
indicateurs calculés ; page _Bilan_ (onglet _Bilan Global_).

---

## 2. Points d'attention constatés dans le code (état des lieux technique)

Ce sont des faits de code, indépendamment de l'avis agronomique :

| #   | Constat                                                                                                                                                                                                                                                                                 | Lieu                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| C1  | `getStockNcoastData` est **mapé dans `Report.vue` (L79) mais n'existe pas** dans le store `report.js` (aucun getter portant ce nom)                                                                                                                                                     | `Report.vue` L79, `report.js`                     |
| C2  | `item.total` est initialisé à `0` dans tous les getters de stocks et **aucun code du store ne le remplit** — seul `totalCost()` du composant Vue le calcule. Or `getCostIndicator`/`getCostIndicatorsKpis` sont des getters du store qui en dépendent (`data['1_fourrage'][...].total`) | `report.js` L90/121/155/194, `mixins.js` L783/873 |
| C3  | Deux variantes « with » des fourrages marquées `// probleme` dans le code                                                                                                                                                                                                               | `mixins.js` L832, L835                            |
| C4  | `getCorrectedLivestockDensities` : commentaire `sumL += ... // n'éxiste pas encore` (la vente)                                                                                                                                                                                          | `mixins.js` L1017                                 |
| C5  | `getCostIndicator` : la clé `tms` des fourrages « avec » divise `o39` (coût total en **€**, incluant la vente) par `(conso + prod + achat − vente)` (en **tMS**) — mélange d'unités                                                                                                     | `mixins.js` L832                                  |
| C6  | La paille est exclue du KPI `totalCost` (4 groupes calculés, seuls `1_fourrage` + `2_concentrated` retenus)                                                                                                                                                                             | `mixins.js` L872                                  |
| C7  | `totalCost()` (Vue) : pour les concentrés, `vente × costOfSell` est **ajouté** (pas déduit) et la production est ignorée (céréales auto-produites)                                                                                                                                      | `StockTable.vue` L187-189                         |
| C8  | `strawCoutProd` = `production × productionCost` de la ligne 0 uniquement : le `total` de la ligne cachée n'est pas utilisé                                                                                                                                                              | `mixins.js` L814                                  |
| C9  | `getCostIndicator` L852 : `ha: (strawCoutProd / 10) * y55` — **multiplication** par la surface alors que les autres clés divisent ; et division par 10 inexpliquée                                                                                                                      | `mixins.js` L852-853                              |
| C10 | `stockCodeList` en dur `['FH','EH','EM','EL','FL']` dans de nombreux getters (sans `AS`), alors que `getStockEvolution` suit aussi `AS` et `STRAW`                                                                                                                                      | `report.js` L220/272/372 etc.                     |
| C11 | `getPastureConsumptionTotal` (L601) : `Σ (conso/animal/j × nb)` puis `× 28 / 1000` global — incohérent avec `getConsumptionForOthers` (L557) où la durée est dans la somme : **à vérifier numériquement**                                                                               | `mixins.js` L601-611                              |
| C12 | `getHerdNeeds` : `potential = 1` en dur — la modération par le potentiel de prairie n'est pas active ici (contrairement à ce que dit la synthèse agronomique §8.1-3)                                                                                                                    | `mixins.js` L960                                  |
| C13 | `getDimensioning` : `chargePotentiel` arrondi à l'**entier** (L309-312) alors que E6/E7/E8 sont arrondis à 2 décimales                                                                                                                                                                  | `report.js` L309                                  |

> **À trancher en priorité** : C1/C2 (le calcul des coûts « avec achat-vente »
> est-il réellement alimenté aujourd'hui ?) et C5 (formule à corriger).

---

## 3. Verdict d'expert — le Bilan en 3 points

> _« J'ai regardé ce que produit ce bilan. Le squelette est bon — un conseiller
> s'attend à voir exactement ces lignes. Mais en l'état, je ne mettrais pas ce
> bilan sous les yeux d'un chef d'exploitation sans réserves. »_

### 3.1 Ce qui est solide (à conserver)

1. **La trame du compte est la bonne.** `Stock initial + Production −
Consommation = Stock final`, avec **Achat** qui monte automatiquement quand
   le solde passe en négatif, et les coûts (production / achat / vente) par
   stock — c'est la grille que les conseillers fourrage manipulent.
2. **Le déclinement par unité de référence** (/ha SFP, /tMS, /UGB, /VL, /1000 L)
   est exactement le bon réflexe pour comparer des systèmes ; la variante
   « avec / sans achat-vente » est une vraie valeur ajoutée (on isole le coût
   structurel du coût d'équilibre).
3. **La logique de dimensionnement en UGB** (E6–E9) est cohérente : on mesure
   la pression du troupeau sur les surfaces, la correction par excédent/achat,
   et le potentiel maximal de la production. C'est un vrai diagnostic.
4. **Le ratio UGB nourri / UGB à nourrir** (V647 vs h646) existe dans le code :
   c'est LA comparaison de cohérence qui manque à l'affichage (voir §5-F1).

### 3.2 Ce qui bloque la confiance

1. **Le coût de production des ensilages est contestable** : en comptant
   `production × coût/ha`, **tout** le rendement est valorisé, y compris ce
   qui n'est pas récolté ni consommé (perte d'ensilage, stock reporté non
   consommé, surproduction…). Un ensilage perd 10–20 % de MS entre récolte et
   consommation : le modèle les compte quand même.
2. **La paille est invisible du KPI** : sur une ferme à litière, c'est
   5 à 15 % du coût fourrager. La partie « paille » est hors du total, donc
   la lecture « part des concentrés » est biaisée.
3. **Les achats sont comptés en quantité mais pas en masse ni en coût
   réellement engagé** : l'achat = tout ce qui manque en fin de stock,
   au prix saisi. Pas de distinction entre ce qui est **consommé** et ce qui
   est **comptable**.
4. **E9 « potentiel » est théorique** : production brute / 4,75, sans taux de
   récolte ni digestibilité. Il est **toujours maximaliste** → le « potentiel
   réalisé » est **toujours en deçà** de la vraie marge, et le seuil 90 % est
   arbitraire.
5. **La « vente » est en l'état un angle mort** (C4 : « n'existe pas encore »)
   alors qu'elle entre dans E8.

### 3.3 La ligne de conduite

**Faire du Bilan un outil de diagnostic, pas seulement un tableau de compte.**
Aujourd'hui il répond à _« combien ça coûte, combien il me manque »_.
Il devrait aussi répondre à _« mon système est-il cohérent, où sont mes
marges, qu'est-ce que j'aurais dû faire »_. C'est tout le §6.

---

## 4. Points bloquants (P1) — à corriger ou à justifier avant tout autre chose

### A. Intégrité du compte de stocks

| #      | Point                                                                                                                                                                                                                                            | Pourquoi c'est bloquant                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A1** | **C1 + C2** : `getStockNcoastData` absent du store, `total` jamais rempli côté store. Si `getCostIndicator`/`getCostIndicatorsKpis` sont appelés par des getters (et non par le composant qui remplit `total`), tous les coûts « avec » = **0**. | Vérifier où `total` est injecté ; soit le déplacer dans un getter de `report.js`, soit documenter que le composant doit le remplir avant. **À faire en premier.**                    |
| **A2** | **C5** : `tms` « avec » = coût total (€) / (quantités en tMS) → **mélange d'unités**. Même problème pour `milleLitre` (C3).                                                                                                                      | Corriger : numérateur = coût correspondant à la dénomination choisie ; dénominateur = quantité réellement consommée (prod + conso pâture + achat − vente). Ou retirer ces deux clés. |
| **A3** | **C4** : la vente est « n'existe pas encore » dans E8, mais existe dans `soldedStock`.                                                                                                                                                           | Soit l'activer (les ventes de surplus sont fréquentes : ensilage maïs reporté vendu, foin…), soit l'exclure de E8 avec un commentaire.                                               |
| **A4** | **C7** : `totalCost` concentrés **ajoute** `vente × costOfSell` au lieu de le déduire, et ignore la production (céréales auto-produites).                                                                                                        | Corriger la formule pour être symétrique avec les fourrages.                                                                                                                         |

### B. Cohérence des indicateurs

| #      | Point                                                                                                                                | Pourquoi c'est bloquant                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **B1** | **C11** : `getPastureConsumptionTotal` (L601) sans × 28 dans la somme, puis × 28 global — incohérent avec `getConsumptionForOthers`. | Vérifier avec un cas numérique ; la conso de pâture entre dans `V647` → tout le dimensionnement en dépend.                                       |
| **B2** | **C10** : `stockCodeList` en dur, sans `AS`.                                                                                         | Un système qui produit de l'AS (ensilage maïs avec céréale, ensilage luzerne non dédiée…) sort du bilan. Rendre la liste dérivée du référentiel. |
| **B3** | **C13** : E9 arrondi à l'entier dans `getDimensioning` (alors que E6/E7/E8 ont 2 décimales).                                         | Harmoniser ; sinon « 3 » vs « 2,87 » change la lecture.                                                                                          |
| **B4** | **C9** : clé `ha` de la paille = `(strawCoutProd / 10) × y55` — incohérente avec les autres clés (division attendue).                | Corriger ou retirer la clé.                                                                                                                      |

### C. Paille

| #       | Point                                                   | Pourquoi c'est bloquant                                                                                             |
| ------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **C-1** | La paille est exclue du KPI `totalCost` (C6).           | Ajouter un `strawPart` ou un `totalCostAll` incluant la paille ; sinon le KPI est faux pour tout système à litière. |
| **C-2** | `strawCoutProd` = production de la ligne 0 × coût (C8). | Utiliser le `total` de la ligne cachée (qui inclut achat − vente) pour que la clé `with` soit cohérente.            |

---

## 5. Points de fond à améliorer (P2)

### D. Le compte de production

- **D1 — Séparer production / récolte / conso.** En l'état, `production` est
  la production **potentielle** (rendement × surface, modulée par l'année
  climatique). Ajouter une **saisie du taux de récolte** (ou une perte
  d'ensilage par code de stock, valeurs par défaut : ensilage maïs 15 %,
  ensilage d'herbe 10 %, foin 5 %) :
  ```
  récolte = production × taux_récolte
  conso_max = récolte − stock_final
  ```
  Sans ça, le coût de production est sur-valorisé (cf. §3.2-1) et l'écart
  production/conso est masqué.
- **D2 — Distinction MS / masse.** Les céréales sont en `qtx` (BL-1), les
  fourrages en tMS. Un tableau de bilan **devrait être en une seule unité de
  masse** — au minimum, un taux MS affiché par ligne (ex. ensilage maïs 30 %,
  foin 90 %) pour que le lecteur puisse raisonner en matière sèche.
- **D3 — Le « stock final » est une comptabilité, pas une masse réelle.**
  Le stock final « réel » = MS encore présente (dépréciation ensilage,
  refus, perte de stockage). Ajouter une ligne « Pertes » ou un
  coefficient de valorisation du stock final.

### E. Les coûts

- **E1 — Rendre explicite la valeur du stock initial.** En l'état, le
  `productionCost` du stock initial (1er janvier) est compté au coût de
  production de **cette** année — or c'est du stock de l'année
  précédente. Soit une saisie du **coût du stock initial** (en €), soit une
  note « le stock initial est valorisé au coût de production de l'année ».
- **E2 — Coût de production = coût total / unité ou coût marginal ?**
  Aujourd'hui c'est un `€/tMS` (ou `€/qtx`) saisi librement. Un conseiller
  attendrait soit un **coût de revient** (charges d'exploitation :
  mécanisation + main d'œuvre + engrais + semences), soit au minimum une
  **valeur de marché** par code de stock (fourrage ensilé ≈ 25–35 €/tMS
  en auto-production, foin ≈ 20–30 €/tMS, ensilage maïs ≈ 15–25 €/tMS —
  à documenter).
- **E3 — La vente doit avoir une quantité.** `costOfSell` existe (€) mais la
  **quantité vendue** n'est pas saisie — elle est dérivée du stock final.
  Ajouter une saisie `vente (tMS)` pour que le coût de vente soit
  `vente × costOfSell` au lieu de se reposer sur un stock final qui peut
  être négatif.
- **E4 — Documenter les valeurs par défaut.** Les `purchaseCost` /
  `costOfSell` / `productionCost` sont saisis **à la main**. Un conseiller
  n'a pas forcément les prix sous la main : proposer des **valeurs
  par défaut par code de stock** (modifiables), tirées de références
  régionales.

### F. Le dimensionnement

- **F1 — Afficher les deux UGB et leur écart.** Le code calcule
  `UGB nourri` (V647) et `UGB à nourrir` (h646) mais l'écart n'est
  **jamais affiché**. Ajouter une ligne « **Écart UGB (nourri − objectif)** » :
  - < 0 → ration sous-dimensionnée (période à risque)
  - > 0 → marge de ration
    > C'est l'indicateur n°1 de cohérence du système.
- **F2 — Corriger la définition du « potentiel réalisé ».** `E8 / E9`
  mélange un E8 « corrigé » (qui inclut les achats) avec un E9 « brut »
  (production brute sans taux de récolte). Le vrai « potentiel » devrait être :
  ```
  E9_corrige = (Σ récolte fourrages + conso pâture max) / 4,75 / SFP
  ```
  avec `récolte = production × taux_récolte` (D1). Sinon, le seuil 90 % est
  arbitraire et le « au potentiel » est presque jamais atteint.
- **F3 — E6 : SAU en saisie libre.** `getEstimatedLivestockDensities`
  utilise `simulation.farm.dimensioning.SAU` (saisie) alors que `getSAU`
  existe et somme les rotations. Soit un avertissement « SAU saisie ≠
  SAU assolement », soit un calcul automatique.
- **F4 — Autonomie : clarifier la lecture.** `E8 − E7 > 0 → « autonome »` :
  aujourd'hui, un système qui **achète du foin** peut être « autonome »
  au sens du modèle (il valorise plus qu'il ne produit en surface pâturée).
  Reformuler : « **Autonome en fourrage stocké** » ou ajouter un second
  indicateur « **Autonomie alimentaire stricte** » =
  `conso fourrages auto-produits / conso fourrages totale` (en %).
- **F5 — UGB par lot.** Ajouter le **nombre de VL équivalent par lot** et
  l'**UGB par lot** pour voir la répartition du troupeau sur les surfaces
  (utile pour le conseil : surcharge d'un lot = surpâturage).

---

## 6. Ajouts recommandés (P3) — ce qui ferait la différence

> C'est là que le Bilan passe de « tableau de compte » à « outil de
> diagnostic ». Les points ci-dessous sont ce qu'un conseiller
> demanderait en priorité dans un outil de conseil.

### G. Le diagnostic fourrager (ajout principal)

| Indicateur                                | Formule                                                                      | Lecture pour le conseiller                                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autonomie fourragère (stricte)**        | `Σ conso fourrages auto-produits / Σ conso fourrages totale` (en %)          | 100 % = tout le fourrage vient de la ferme ; 70 % = 30 % achetés. **L'indicateur n°1.**                                                       |
| **Autonomie alimentaire (stricte)**       | `Σ conso fourrages + conso concentrés auto-produits / Σ conso totale` (en %) | inclut les céréales auto-produites.                                                                                                           |
| **Indépendance fourragère**               | `E7 / E9_corrige` (pression / potentiel)                                     | si > 1 → système qui demande plus de fourrage qu'il ne produit.                                                                               |
| **Rendement fourrager par UGB**           | `Σ récolte fourrages / UGB_nourri` (tMS/UGB)                                 | valeur de référence 4,75 ; si > 5 → marge, si < 4 → tension.                                                                                  |
| **Part de la pâture dans l'alimentation** | `conso pâture / (conso pâture + conso fourrages stockés)` (en %)             | lecture du système pâturé vs stocké.                                                                                                          |
| **Taux de couverture MS**                 | `V647 (nourri) / h646 (objectif)` (en %)                                     | < 100 % = ration insuffisante quelque part.                                                                                                   |
| **Excédent / déficit fourrager mensuel**  | `Σ (récolte − conso) par période` (en tMS)                                   | **le graphique à afficher absolument** : il montre le creux de l'hiver, le pic d'ensilage maïs, etc. C'est l'outil de conseil par excellence. |

### H. La cohérence du système (alertes)

Un conseiller **regarde** un bilan avant de le **calculer**. Ajouter un
bloc « **Alertes** » au-dessus du tableau :

- 🔴 **Crise de stock** : `stock_final < 0` sur une période →
  « Période X : déficit de Y tMS en EM ».
- 🔴 **Surstock** : `stock_final > seuil` (ex. > 3 mois de conso) →
  « Stock d'EM trop important en fin de récolte — risque de perte ».
- 🔴 **Achat massif** : `purchase > 10 % de la conso` → « Dépendance
  forte aux achats de RC — 30 % de la conso achetée ».
- 🟡 **Ration insuffisante** : `UGB_nourri < UGB_objectif` →
  « Le troupeau est sous-alimenté : Z UGB de moins que l'objectif ».
- 🟡 **Potentiel non valorisé** : `E9 − E8 > seuil` →
  « La production pourrait porter X UGB de plus ».
- 🟡 **Paille en tension** : `conso paille > production paille × 1,1` →
  « Le besoin en paille dépasse la production : acheter ou ajuster le logement ».
- 🟢 **Système autonome** : `autonomie > 0` et `E8/E9_corrige < 90 %` →
  « Système autonome avec marge de progression ».

Ces alertes sont **les** livrables d'un conseiller fourrage : elles transforment
un tableau en **recommandation d'action**.

### I. La vision annuelle

- **I1 — Graphique des stocks par période** : courbe du stock final de chaque
  code de stock (FH, EH, EM, EL, RC, RP, STRAW) sur les 13 périodes —
  le `getStockEvolution` (L336) existe déjà, il suffit de l'afficher.
- **I2 — Graphique production/conso** : par période, barres de production
  vs barres de conso (avec le cumulé des stocks en ligne).
- **I3 — Tableau de synthèse annuelle** : une page de synthèse « Bilan
  Global » avec les indicateurs clés (autonomie, E7, E8, E9, coût / VL,
  coût / 1000 L, part des concentrés) + les alertes (H). C'est ce que le
  conseiller montre au chef d'exploitation.

### J. La comparaison des scénarios

- **J1 — Comparaison avec l'année dernière** : une simulation « année
  précédente » en référence (diff des indicateurs).
- **J2 — Comparaison de deux assolements** : deux simulations côte à côte
  (même troupeau, assolements différents) — les indicateurs E6–E9 et le
  coût / VL se comparent directement.
- **J3 — Comparaison avec des référentiels régionaux** : des fourchettes
  de référence par type de système (vaches laitières : coût / VL entre
  X et Y €/VL/an, autonomie entre A et B %).

### K. L'export & l'interopérabilité

- **K1 — Export bilan au format Excel** (pas seulement CSV) : les
  conseillers travaillent dans Excel ; un export **au format du tableur de
  référence** (mêmes cellules E6–E9, Y648) permettrait une reprise
  directe.
- **K2 — Export des alertes** (H) dans un PDF / rapport de conseil.
- **K3 — Import d'un bilan Excel existant** pour initialiser la simulation
  (coûts saisis, stocks initiaux, productions).

### L. Les coûts — ce qu'il manque vraiment

- **L1 — Coût par litre de lait (hors concentrés)** : `coût fourrages × 1000
/ prod lait` — isoler le coût « fourrager » du coût « total ».
- **L2 — Coût par UGB hors paille** : pour comparer avec les références
  régionales (qui sont souvent hors paille).
- **L3 — Part des achats dans le coût total** (en %) : indicateur
  d'indépendance directe.
- **L4 — Coût marginal d'un UGB supplémentaire** : `Δcoût / ΔUGB` — utile
  pour évaluer le coût de l'agrandissement du troupeau.

### M. La documentation des hypothèses

- **M1 — Page « Hypothèses du modèle »** : lister les hypothèses
  (UGB = 4,75, 13 périodes de 28 j, taux de refus, report de pâture − 8 %,
  deux années climatiques) et les **valeurs par défaut** des coûts.
  Aujourd'hui, le conseiller ne peut pas savoir **sur quelles hypothèses**
  le bilan est calculé.
- **M2 — Tooltip sur chaque indicateur** : explication agronomique
  (ex. « E7 : pression du troupeau sur la surface pâturée — si > 1,5
  UGB/ha, la prairie est sollicitée fort »).

---

## 7. Synthèse priorisée — ce qu'il faut faire, dans l'ordre

| Priorité | Action                                                                            | Effort estimé | Impact                                               |
| -------- | --------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------- |
| **P1**   | **A1** : corriger `getStockNcoastData` / `total` (C1, C2)                         | 1 j           | **Bloquant** — sans ça, les coûts « avec » sont faux |
| **P1**   | **A2** : corriger `tms` / `milleLitre` « avec » (C3, C5)                          | 0,5 j         | **Bloquant** — unités mélangées                      |
| **P1**   | **A4** : corriger `totalCost` concentrés (C7)                                     | 0,25 j        | Bloquant                                             |
| **P1**   | **B1** : vérifier `getPastureConsumptionTotal` (C11)                              | 0,5 j         | Bloquant (toute la chaîne UGB)                       |
| **P2**   | **D1** : taux de récolte / perte d'ensilage                                       | 2 j           | Fondamental pour le coût de production               |
| **P2**   | **E3** : saisie `vente (tMS)` + coût de vente                                     | 1 j           | Cohérence du compte                                  |
| **P2**   | **F1** : afficher l'écart UGB nourri / objectif                                   | 0,5 j         | **Indicateur n°1 de cohérence**                      |
| **P2**   | **C-1** : inclure la paille dans le KPI                                           | 0,5 j         | KPI vrai pour les systèmes à litière                 |
| **P3**   | **G** : diagnostics fourragers (autonomie stricte, part pâture, excédent mensuel) | 3 j           | **Le cœur de la valeur ajoutée**                     |
| **P3**   | **H** : bloc d'alertes                                                            | 3 j           | **Le cœur de la valeur ajoutée**                     |
| **P3**   | **I1** : graphique des stocks par période                                         | 1 j           | Lecture immédiate du creux hivernal                  |
| **P3**   | **M1** : page des hypothèses                                                      | 0,5 j         | Confiance du conseiller                              |
| **P3**   | **K1** : export Excel au format de référence                                      | 2 j           | Interopérabilité avec les outils existants           |

**Total** : ~14 j pour transformer le Bilan d'un tableau de compte en un
**outil de diagnostic fourrager** utilisable en conseil.

---

## 8. Références internes

- Formules du bilan : [synthese-exploitation-simulee.md §5](synthese-exploitation-simulee.md)
- Vue agronomique du modèle : [synthese-agronomique.md §5](synthese-agronomique.md)
- Cycle par item (où chaque code de stock entre/sort) : [cycle-de-vie-des-items.md](cycle-de-vie-des-items.md)
- Tickets en cours touchant le Bilan : [tickets/INDEX.md](../../projet/tickets/INDEX.md)
  - ticket 2/8 (paille) ✅, ticket 3 (unités) partiel, ticket 9 (onglets) ✅,
  - ticket 12 (tourteaux) 📄 à trancher, ticket 14 (valeurs pâture) ⏳ INRAE
- Code :
  - `services/frontend/ui/src/store/modules/mixins.js` (L543–L1061)
  - `services/frontend/ui/src/store/modules/report.js` (L64–L382)
  - `services/frontend/ui/src/components/parts/barn/StockTable.vue`
  - `services/frontend/ui/src/components/parts/report/modules/stockNcost/CostIndicatorModal.vue`
