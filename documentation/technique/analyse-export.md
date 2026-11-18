# Analyse de l'export — Workspace (mappage & calculs)

> Analyse complète du mécanisme d'export du Rami (base de recherche) : ce qui est
> **déjà mappable (codé)** et **comment**, et ce qui **pourrait être mappable (à
> coder)**.
> État du code : 2026-11-17.
> Lié au [ticket 16](tickets/ticket-16-export-nom-colonnes.md) (nom obligatoire +
> colonnes manquantes dans l'aperçu).

---

## 1. Le mécanisme d'export (comment ça marche)

L'export est un système **générique par mapping** : on définit un **mapping**
(une liste de colonnes), et le Rami calcule chaque colonne de la **simulation
sélectionnée** à partir d'une **fonction de calcul**.

### 1.1 Acteurs

| Fichier | Rôle |
|---|---|
| `views/workspace/Export.vue` | UI : liste des mappings, sélection des simulations, bouton « Exporter en CSV », aperçu |
| `views/workspace/MappingModal.vue` | UI : création/édition d'un mapping (nom + colonnes) |
| `views/workspace/previewModal.vue` | UI : aperçu des lignes générées + **téléchargement CSV** |
| `store/modules/mapper.js` | store : état (`mapping`, `simulationsSelected`) + action **`prepareExport`** |
| `store/modules/calculations.js` | **le catalogue des fonctions de calcul** mappables |
| `store/modules/mixins.js` | les calculs métier réels (chargements, stocks, coûts…) consommés par `calculations.js` |

### 1.2 Format d'un mapping (persisté dans `workspace.mappings`)

```jsonc
{
  "name": "cape2er",            // nom du mapping
  "protected": true,            // mapping protégé (non supprimable)
  "inUse": false,
  "fields": [                   // les colonnes du CSV
    { "key": "Nom du champ CSV", "value": { "label": "…", "calc": "getUgbN" } }
    // value.calc = nom de la fonction dans calculations.js
  ]
}
```

> ⚠️ **Bug latent (ticket 16)** : dans `MappingModal.vue`, la table des champs
> existants utilise `:items="simulationFields"` qui **n'est pas défini** (seul
> `fieldList` existe) → le select de la valeur d'une colonne existante est vide.
> La création d'une **nouvelle** colonne (via `fieldList`) fonctionne, mais
> l'édition non.

### 1.3 Flux de génération (`mapper.js` → `prepareExport`)

```
pour chaque simulation sélectionnée :
  1. charger la simulation dans le store (workspace/loadSimulator)
  2. recalculer la pâture + la production (farm/…ByPeriod, farm/dispatchProduction)
  3. row = { simulation_name: sim.name }
  4. pour chaque field du mapping :
        result = calculations[field.value.calc](ctx)   # ctx = extractParams()
        row[field.key] = result
  → retourne la liste des rows
```

`extractParams()` construit le contexte : `{ sim, batchs, periods, getStic,
totalAvailablePastureByPeriod }`. Chaque fonction de calcul est enveloppée par
`wrap()` qui reçoit ce contexte.

### 1.4 Génération du CSV (`previewModal.vue` → `downloadCsv`)

- Séparateur `;`, BOM UTF-8, chaque valeur entre guillemets (`"` échappé `""`).
- En-tête = clés de la 1re ligne (`simulation_name` + les `key` du mapping).
- Fichier `export_AAAA-MM-JJ.csv`.
- ⚠️ **Bug (ticket 16)** : l'en-tête affiche `key` tel quel (sauf
  `simulation_name`) — aucune traduction, donc les libellés des colonnes sont
  illisibles dans l'aperçu et le CSV.

---

## 2. Ce qui est **déjà mappable** (catalogue `calculations.js`)

Chaque entrée est une fonction enveloppée (`wrap`) → sélectionnable dans le
`MappingModal`. La clé i18n est `export.calculations.<nom>` (`fr.json`).

| Fonction (`calc`) | Libellé (fr.json) | Calcule | Source (mixins.js) |
|---|---|---|---|
| `getNbAnimaux` | Nombre total d'animaux | total tête d'exploitation | `getTotalHerd` |
| `getUgbN` | UGB nécessaires | UGB nourris par le système | `getUGBSystem` |
| `getUgbAN` | UGB à nourrir | UGB objectif (besoin MS) | `getUGBtoFeed` |
| `getChargeSAU` | Charge UGB estimée / SAU | E6 | `getEstimatedLivestockDensities` |
| `getChargeApparent` | Charge UGB apparente / SAU | E7 | `getApparentLivestockDensities` |
| `getChargeCorrige` | Charge UGB corrigée / SAU | E8 | `getCorrectedLivestockDensities` |
| `getChargePotentiel` | Charge UGB potentielle | E9 (Y648) | `getPotentialLivestockDensities` |
| `getAutonomy` | Autonomie alimentaire | E8 − E7 | `getAutonomy` |
| `getFourragesRecoltes` | Fourrages récoltés | tMS/UGB | `getHarvestedFodder` |
| `getSfpSau` | SFP / SAU | % | `getSFP_SAU` |
| `getPpSau` | Prairies permanentes / SAU | % | `getPP_SAU` |
| `getPtSau` | Prairies temporaires / SAU | % | `getPT_SAU` |
| `getPotential` | Potentiel atteint | E8/E9 × 100 | `getPotential` |
| `getPP` | Prairie permanente | surface (ha) | `getRotationSurface('PP')` |
| `getPT` | Prairie temporaire | surface (ha) | `getRotationSurface('PT')` |
| `getCorn` | Maïs ensilage et autres fourrages | surface (ha) | `getRotationSurface('PCF')` |
| `getMilkProdcution` | Lait produit | kg | `getMilkProducted` (VL) |
| `getSoldedMilk` | Lait vendu | kg (× 0,95) | `getMilkProducted × 0.95` |
| `getMilkConsum` | Lait veaux/autoconsommé/jeté | kg (× 0,05) | `getMilkProducted × 0.05` |
| `isToComplet` | A compléter manuellement | marqueur `TO_COMPLETE` | — |

> **Toutes ces fonctions portent sur le « Bilan / Dimensionnement »** (chargements,
> autonomie, potentiel, surfaces, lait). C'est le périmètre actuel de l'export.

### 2.1 Limites de ce qui est déjà codé

- **Un seul champ « simulation_name »** en plus des colonnes du mapping : pas de
  site, pas d'année climatique, pas de date d'export dans la ligne.
- **`stockCodeList` figé** à `['FH','EH','EM','EL','FL']` dans `calculations.js`
  (pas `AS`, ni RC/RP, ni STRAW) → les chargements ignorent « autre stock ».
- **Le mapping par défaut du workspace est vide** (`cape2er` a `fields: []`) →
  l'export ne produit que `simulation_name` tant qu'un mapping n'est pas complété.
- **Bug `simulationFields`** (§1.2) → éditer un mapping est cassé.
- **Colonnes non traduites** dans l'aperçu/CSV (ticket 16).
- **Nom de simulation non validé** (TODO dans `Export.vue` : « mettre un contrôle sur
  le nom de la simulation qui est obligatoire »).

---

## 3. Ce qui **pourrait être mappable** (à coder)

Le mécanisme étant générique, **tout ce qui existe dans `mixins.js` / les getters du
store** est potentiellement mappable en ajoutant une fonction dans
`calculations.js` (+ une clé i18n `export.calculations.<nom>`). Voici les familles
manquantes, classées par valeur.

### 3.1 Surfaces & assolement (facile — `getRotationSurface` existe)
- **SAU totale** (`getSAU`) ; **SFP totale** (ha, `getSFP`) ; **surface paille**
  (`getStrawSurface`) ; surfaces par type de baguette (céréales `C`, ensilage `E`,
  …) via `getRotationSurface(code)`.

### 3.2 Stocks (par code) — via getters `report.js` / `mixins.js`
Pour chaque code de stock (`FH, FL, EH, EM, EL, AS, RC, RP, STRAW`) :
- **Stock initial** `getInitialStockByBarnStockItem`
- **Production** `getSticProductionByBarnStockItem`
- **Consommation** `getConsumptionByBarnStockItem`
- **Stock final** `getFinalStockByBarnStockItem`
- **Achat nécessaire** `getPurchaseValueByBarnStockItem`
- **Valeur consommée / coût** (`item.total` de `getClassicFeedsStock` /
  `getConcentratedFeedsStock` / `getStrawStock`)

→ Permet un export **STOCKS ET COUTS complet** (le cœur de la demande du mail),
actuellement absent de l'export.

### 3.3 Paille (tickets 2/8)
- **Paille aliment** `getFoodStrawConsumption`, **paille logement**
  `getHousingStrawConsumption`, **paille totale** `getConsumptionForStraw`,
  **production paille** `setTotalStrawStock` → 2–4 colonnes paille.

### 3.4 Coûts & indicateurs économiques — via `getCostIndicator` / `getCostIndicatorsKpis`
- **Coût fourrage** (sans/avec achat-vente) par clé : /ha SFP, /tMS, /UGB, /VL,
  /1000 L.
- **Coût concentré** (idem) ; **coût paille** ; **coût total** ;
  **part des concentrés** (%).

### 3.5 Couvertures nutritionnelles (par lot → à agréger)
- **Couverture énergétique** `getEnergeticCoverage` / `getFinalEnergeticCoverage`
  (min/moyenne/par période).
- **Couverture protéique** `getProteicCoverage`.
  ⚠️ Ces fonctions renvoient un **tableau par période** → il faut décider l'agrégation
  (moyenne annuelle, minimum, ou 1 colonne par période).

### 3.6 Troupeau & production
- **Lait** : déjà codé (`getMilkProdcution`/`getSoldedMilk`/`getMilkConsum`).
- **Nb animaux par type de lot** (VL, VV, génisses…) — agrégation sur
  `herd.batchs` filtrés par `batch_type.code`.
- **Masse/viande** si présents dans les profils (à vérifier selon type de lot).

### 3.7 Métadonnées de la simulation (facile)
- **Site** (`sim.site`), **année climatique** (`sim.climaticYear`), **description**,
  **date de dernière modification** (`lastModifiedDate`) → colonnes fixes ou mappables.

### 3.8 Pâture
- **Production pâture totale** `getPastureProductionTotal` ;
  **consommation pâture** `getPastureConsumptionTotal` ;
  **solde pâture** `getPastureFinalStock` ; **achat pâture** `getPasturePurchaseValue`.

---

## 4. Recommandations de mise en œuvre (si on étend l'export)

1. **Corriger d'abord le ticket 16** (nom obligatoire + colonnes traduites +
   `simulationFields` manquant) — c'est le socle utilisable.
2. **Étendre `calculations.js`** par familles (§3) — chaque calcul = 1 fonction
   `wrap` + 1 clé i18n. Priorité suggérée :
   - **stocks par code** (§3.2) + **coûts** (§3.4) → export « Stocks et coûts »
     (le plus demandé) ;
   - **paille** (§3.3) ;
   - **surfaces/SAU** (§3.1) et **métadonnées** (§3.7) (faciles, forte valeur).
3. **Paramétrer le `stockCodeList`** (au lieu de le figer à FH/EH/EM/EL/FL) pour
   inclure `AS`, et gérer RC/RP/STRAW selon l'unité.
4. **Décider l'agrégation des couvertures** (tableau par période → moyenne/minimum).
5. **Prévoir un mapping « standard » protégé** (type `cape2er` mais pré-rempli) pour
   que l'export ait un périmètre par défaut utile.

---

## 5. Résumé

| | Déjà mappable (codé) | À coder (mappable) |
|---|---|---|
| **Dimensionnement** | ✅ chargements E6–E9, autonomie, potentiel, UGB, surfaces PP/PT/corn | — |
| **Lait** | ✅ produit / vendu / consommé | — |
| **Stocks par code** | ❌ | ✅ initial / prod / conso / final / achat (tous codes) |
| **Coûts** | ❌ | ✅ par clé (ha, tMS, UGB, VL, 1000 L) + KPI |
| **Paille** | ❌ | ✅ aliment / logement / production |
| **Couvertures** | ❌ | ✅ énergétique / protéique (agrégation à définir) |
| **Surfaces / SAU** | partiel (PP/PT/corn) | ✅ SAU, SFP, surface paille, par type |
| **Troupeau** | ✅ nb total | ✅ par type de lot |
| **Pâture** | ❌ | ✅ production / conso / solde |
| **Métadonnées** | ✅ simulation_name | ✅ site, année climatique, date |

**Mécanisme** : générique et extensible — ajouter une fonction dans
`calculations.js` (+ clé i18n) suffit pour ouvrir une nouvelle colonne. Les
limitations actuelles sont : périmètre limité au bilan/lait, `stockCodeList` figé,
mapping par défaut vide, et les bugs du ticket 16 (nom obligatoire, colonnes
non traduites, `simulationFields` manquant).
