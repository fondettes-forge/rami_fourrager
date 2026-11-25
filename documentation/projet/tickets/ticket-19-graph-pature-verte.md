# Ticket 19 — Graphique « pâture verte disponible et besoin du troupeau »

> **Provenance** : Devis 2025 (R12) — `2025081802D_devis_Antoine_Savoie_inrae_correctifs`
> Statut : **✅ Implémenté** (2026-11-25) · Priorité : **moyenne** · Type : nouvelle fonctionnalité
> Date de l'analyse : 2026-11-18

---

## 1. Analyse

### 1.1 La demande

> Ajouter le graphique « pâture verte disponible et besoin du troupeau » (à mettre
> dans le module Assolement) qu'on avait choisi de ne pas ajouter mais qui est dans
> l'Excel.

### 1.2 État actuel

Le module Assolement (`Farm.vue`) affiche les rotations et les surfaces, mais pas
le graphique de comparaison entre la **pâture verte disponible** (production par
période) et le **besoin du troupeau** (consommation pâturée par période). Ce
graphique existe dans le classeur Excel de référence.

## 2. Recommandation

1. **Créer un composant** `PastureGreenChart.vue` :
   - Graphique en barres (ou lignes) avec 2 séries :
     - **Pâture verte disponible** : `totalAvailablePastureByPeriod[period].production_total`
     - **Besoin du troupeau** : `getGreenPastureConsumption` (agrégé sur les lots)
   - Axes : X = périodes (P1–P13), Y = kgMS/jour (ou tMS).
   - Légende + tooltips.
2. **Intégrer dans `Farm.vue`** :
   - Ajouter le composant dans l'onglet « Assolement », sous la table des rotations.
3. **`fr.json`** : ajouter les libellés (titre, légende, axes).

## 3. Fichiers impactés

| Fichier                                                     | Changement                       |
| ----------------------------------------------------------- | -------------------------------- |
| `src/components/parts/farm/PastureGreenChart.vue` (nouveau) | Graphique pâture verte vs besoin |
| `src/views/simulator/Farm.vue`                              | Intégrer le composant            |
| `src/locales/fr.json`                                       | Libellés                         |

## 4. Critères d'acceptation

1. Dans le module Assolement, un graphique s'affiche avec 2 séries :
   - Pâture verte disponible (production par période).
   - Besoin du troupeau (consommation pâturée par période).
2. Les valeurs sont cohérentes avec les calculs existants.
3. Le graphique est lisible (légende, tooltips, axes).

## 5. Estimation

| Bloc                          | Effort   |
| ----------------------------- | -------- |
| Créer le composant graphique  | ~0,7 j   |
| Intégrer dans Farm.vue + i18n | ~0,3 j   |
| **Total**                     | **~1 j** |

---

## 6. Implémentation (2026-11-25)

### 6.1 Fichiers modifiés

| Fichier                                                         | Changement                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/store/modules/mixins.js`                                   | **nouvelle export** `getPastureConsumptionByPeriod(simulation, periodIndex, totalAvailablePastureByPeriod)` : agrège `getTotalPastureConsumption` (pâture verte + reportée, L335 existante) × `presence.animalCount` sur tous les lots, **par période** (kgMS/période). Gardes vides : pas de lots / `totalAvailablePastureByPeriod` null → 0.    |
| `src/store/modules/farm.js`                                     | **nouveau getter** `getPastureGreenComparison` : retourne `{ disponible[], besoin[] }` (13 valeurs, une par période P1–P13). `disponible` = `production_total` arrondi (kgMS) ; `besoin` = `getPastureConsumptionByPeriod` arrondi.                                                                                                               |
| `src/components/parts/farm/PastureGreenChart.vue` (**nouveau**) | Graphique barres groupées (pattern `RotationGraph.vue` : v-chart, echarts, thème `infographic`, `autoresize`). 2 séries : « Pâture verte disponible » (vert foncé `#265728`) et « Besoin du troupeau » (vert clair `#D2EAD3`). X = P1–P13, Y = kgMS. Légende + tooltip `axis` (2 valeurs au survol). Garde vide : message i18n si pas de données. |
| `src/views/simulator/Farm.vue`                                  | Intégration de `<pasture-green-chart>` sous le `rotation-graph` (colonne cols="7"), import + registre composant.                                                                                                                                                                                                                                  |
| `src/locales/fr.json`                                           | Clés `farm.pastureGreenChart.*` (titre, 2 séries, unité, état vide).                                                                                                                                                                                                                                                                              |
| `tests/unit/vuex/pastureGreen.spec.js` (**nouveau**)            | 8 tests verts (getter + mixin + états vides).                                                                                                                                                                                                                                                                                                     |

### 6.2 Unité retenue (point de vigilance)

**kgMS / période** pour les deux séries, comme `production_total` de
`totalAvailablePastureByPeriod`. Attention : l'agrégat existant
`getPastureConsumptionTotal` (mixins L602) convertit en **tMS/an** (`×28/1000`) ;
ce ticket ne convertit pas (la comparaison disponible/besoin doit se faire dans
la même unité, par période). L'unité exacte du « besoin » dans l'Excel de
référence reste un point à confirmer avec INRAE (Antoine) — si l'Excel est en
kgMS/jour ou tMS, ajuster le facteur d'affichage uniquement.

### 6.3 Tests

`tests/unit/vuex/pastureGreen.spec.js` — **8/8 ✅** :

- getter : longueur des arrays = nb de périodes ; `disponible` = `production_total` arrondi ; `besoin` ≥ 0 ; état vide (`totalAvailablePastureByPeriod` null) sans crash ; pas de lots → besoin 0.
- mixin : 0 sans lots / batchs undefined / agrégat sur le fixture rootState.

Total suites vertes du projet : **53/53** (pastureGreen 8 + straw 15 + referential 7 +
concentrated 8 + coverage 6 + metadata 9).
