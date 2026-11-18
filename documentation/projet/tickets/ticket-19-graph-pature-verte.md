# Ticket 19 — Graphique « pâture verte disponible et besoin du troupeau »

> **Provenance** : Devis 2025 (R12) — `2025081802D_devis_Antoine_Savoie_inrae_correctifs`
> Statut : **à traiter** · Priorité : **moyenne** · Type : nouvelle fonctionnalité
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

| Fichier | Changement |
|---------|-----------|
| `src/components/parts/farm/PastureGreenChart.vue` (nouveau) | Graphique pâture verte vs besoin |
| `src/views/simulator/Farm.vue` | Intégrer le composant |
| `src/locales/fr.json` | Libellés |

## 4. Critères d'acceptation

1. Dans le module Assolement, un graphique s'affiche avec 2 séries :
   - Pâture verte disponible (production par période).
   - Besoin du troupeau (consommation pâturée par période).
2. Les valeurs sont cohérentes avec les calculs existants.
3. Le graphique est lisible (légende, tooltips, axes).

## 5. Estimation

| Bloc | Effort |
|------|--------|
| Créer le composant graphique | ~0,7 j |
| Intégrer dans Farm.vue + i18n | ~0,3 j |
| **Total** | **~1 j** |
