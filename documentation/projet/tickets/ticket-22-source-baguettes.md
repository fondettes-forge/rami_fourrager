# Ticket 22 — Colonne « source » pour les baguettes

> **Provenance** : Devis 2025 (R33) — item hors devis numéroté
> Statut : **à traiter** · Priorité : **basse** · Type : nouvelle fonctionnalité
> Date de l'analyse : 2026-11-18

---

## 1. Analyse

### 1.1 La demande

> Ajouter une colonne source pour les baguettes.

### 1.2 État actuel

Le référentiel des baguettes (`fichier_baguettes_fourrage.csv`) a les colonnes :
`site`, `annee`, `type`, `Abrev_baguette`, `P1`–`P13`, `M1`–`M13`, `Rdt_paille`,
`Designation_baguettes`, `RU`, `IN`, `ITK`, `Détail_ITK`, `Type_pature`.

Il n'y a **pas de colonne « source »** pour indiquer d'où vient la baguette
(ex. « INRAE », « expérimentation locale », « estimation »).

## 2. Recommandation

1. **Backend** :
   - Ajouter la colonne `source` dans `fichier_baguettes_fourrage.csv`.
   - Mettre à jour le mapping (`mapping_baguettes_fourrage.json`) pour mapper
     `source` → `Stic.source`.
   - Ajouter la colonne `source` dans le modèle `Stic` (`models.py`) + migration
     alembic.
   - Exposer `source` dans l'endpoint API des Stic.
2. **Frontend** :
   - Ajouter `source` dans le schéma `stic.js`.
   - Afficher la source dans le tableau des baguettes (si existant) ou dans le
     détail de la baguette.
   - Ajouter un champ `source` (select ou texte) dans le formulaire de création
     de baguette (`SticModal.vue`).

## 3. Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `services/backend/referential/fichier_baguettes_fourrage.csv` | Ajouter colonne `source` |
| `services/backend/referential/mapping_baguettes_fourrage.json` | Mapper `source` → `Stic.source` |
| `services/backend/project/repository/models.py` | Ajouter `source` dans `Stic` |
| `services/backend/migrations/versions/...` | Migration alembic |
| `services/frontend/ui/src/schemas/stic.js` | Ajouter `source` |
| `services/frontend/ui/src/components/parts/herd/SticModal.vue` | Champ `source` |

## 4. Critères d'acceptation

1. La colonne `source` existe dans le CSV des baguettes.
2. L'utilisateur peut saisir une source lors de la création d'une baguette.
3. La source est affichée dans l'UI (tableau ou détail).
4. La source est persistée et synchronisée avec l'API.

## 5. Estimation

| Bloc | Effort |
|------|--------|
| Backend (CSV + mapping + modèle + migration) | ~0,3 j |
| Frontend (schéma + formulaire + affichage) | ~0,2 j |
| **Total** | **~0,5 j** |
