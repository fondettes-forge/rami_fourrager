# Ticket 22 — Colonne « source » pour les baguettes

> **Provenance** : Devis 2025 (R33) — item hors devis numéroté
> Statut : **✅ Implémenté** · Priorité : **basse** · Type : nouvelle fonctionnalité
> Date de l'analyse : 2026-11-18 · Implémenté : 2026-11-24

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
   PAS d'AFFICHAGE DE LA SOURCE, on stocke uniquement
   - Ajouter `source` dans le schéma `stic.js`.
   - Ajouter un champ `source` (select ou texte) dans le formulaire de création
     de baguette personnalisé (`SticModal.vue`).
     les bageuttes personnalisé sont stocké uniquement dans lenavigateur et dans le fichier json de sauvegarde sur l'ordinnateur de l'utilisateur. le processus d'ajout de nouvelle baguette dans le référenciel est un flux manuel avec validation par mail.

## 3. Fichiers impactés

| Fichier                                                        | Changement                      |
| -------------------------------------------------------------- | ------------------------------- |
| `services/backend/referential/fichier_baguettes_fourrage.csv`  | Ajouter colonne `source`        |
| `services/backend/referential/mapping_baguettes_fourrage.json` | Mapper `source` → `Stic.source` |
| `services/backend/project/repository/models.py`                | Ajouter `source` dans `Stic`    |
| `services/backend/migrations/versions/...`                     | Migration alembic               |
| `services/frontend/ui/src/schemas/stic.js`                     | Ajouter `source`                |
| `services/frontend/ui/src/components/parts/herd/SticModal.vue` | Champ `source`                  |

## 4. Critères d'acceptation

1. La colonne `source` existe dans le CSV des baguettes.
2. L'utilisateur peut saisir une source lors de la création d'une baguette.
3. La source est persistée et synchronisée avec l'API.

## 5. Estimation

| Bloc                                         | Effort     |
| -------------------------------------------- | ---------- |
| Backend (CSV + mapping + modèle + migration) | ~0,3 j     |
| Frontend (schéma + formulaire + affichage)   | ~0,2 j     |
| **Total**                                    | **~0,5 j** |

## 6. Implémentation (2026-11-24)

**Backend** :

- `models.py` : colonne `source = db.Column(db.String(255))` sur `Stic` ;
- migration alembic `d3f8a21c9b4e` (add_column `stic.source`, nullable) —
  **à exécuter** (`alembic upgrade head`) + **re-seed** du référentiel (la
  colonne `source` du CSV est vide pour l'instant) ;
- `generic_views.py` : `source` exposé dans le marshmallow `stic` (l'API
  sérialise donc la colonne) ;
- `fichier_baguettes_fourrage.csv` (gitignored) : colonne `source` ajoutée en
  fin (valeurs vides) ; `mapping_baguettes_fourrage.json` (gitignored) :
  `"source": "source"` ; l'`exemple_*.csv` (tracké) est mis à jour.

**Frontend** :

- `schemas/stic.js` : champ `source` (string) ;
- `SticModal.vue` : champ texte « Source de la baguette » dans l'onglet
  « Le détail » (libellé : ex. INRAE, expérimentation locale, estimation) +
  `source: ''` dans le modèle de création ;
- `Content.vue` : colonne « Source » dans le datatable des baguettes du
  workspace (entre « Nom » et « Actions »).

**Note** : les baguettes du référentiel n'ont pas de `source` (colonne vide) —
le champ est surtout utile pour les baguettes **créées localement** dans le
workspace.
