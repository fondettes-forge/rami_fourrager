# Ticket 24 — Métadonnées référentiel (résumé baguette + doc injecteur)

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §24.
> Statut : **en cours** · Priorité : **haute** · Type : nouvelle fonctionnalité
> Date de l'analyse : 2026-11-18
>
> **2026-11-23** : la **suppression** du référentiel est retirée du périmètre →
> déplacée au backlog ([BL-2](BACKLOG.md)). Effort du ticket : ~2 j → **~1 j**
> (devis 05D : 16 h → 8 h, 800 € → 400 €).
>
> **2026-11-24** : spec §2.1 validée (stockage en DB pour l'ensemble des
> métadonnées + tooltip consolidé). **Implémentation faite** (code + tests 9/9
> verts) — section implémentation en §7. Le code est en attente de commit
> (accord utilisateur). La doc injecteur (§2.3) est écrite en parallèle par
> l'INRAE dans `documentation/technique/injecteur-referentiel.md`.

---

## 1. Analyse

### 1.1 La demande

> L'idée est de pouvoir stocker les métadonnées liées aux différentes informations
> du référentiel. Cela permet un enrichissement et le stockage de ces infos. Les
> valeurs reposent sur l'historique de production des baguettes. Il faut se mettre
> d'accord sur ce que l'on veut persister et comment.
>
> On en profite pour ajouter un champ « résumé » à afficher au survol de la
> baguette.
>
> Faire de la doc sur l'injecteur. Il n'y a pas de suppression.

### 1.2 État actuel

- Le référentiel (baguettes, sites, années climatiques, types de ration, etc.) est
  géré via des **CSV** injectés dans la base via un **injecteur** (script Python).
- Il n'y a **pas de mécanisme de suppression** : une fois injecté, un élément du
  référentiel ne peut pas être supprimé.
- Il n'y a **pas de champ « résumé »** pour les baguettes (un court texte
  d'explication affiché au survol).
- Il n'y a **pas de documentation** de l'injecteur (comment l'utiliser, format des
  CSV, etc.).

## 2. Recommandation

### 2.0 Suppression des éléments du référentiel — **retirée du périmètre**

> ⚠️ **2026-11-23** : la suppression est déplacée au backlog
> ([BL-2](BACKLOG.md)) — à traiter séparément (endpoints `DELETE` + contraintes
>
> - UI, ~1 j). Le reste du ticket 24 (résumé + doc injecteur) est inchangé.

### 2.1 Spec des métadonnées (définition, périmètre, stockage)

> Ajout du 2026-11-24. La doc injecteur
> (§2.3) est écrite en parallèle par l'INRAE ; hors périmètre de code du ticket.
>
> **Validé 2026-11-24** : stockage en DB pour l'ensemble des métadonnées
> (§2.1.3) et **affichage consolidé en un seul tooltip au survol du libellé** :
> description + source + date de mise à jour (§2.1.3).

#### 2.1.1 Définition

Une **métadonnée** = une donnée **descriptive** qui qualifie un élément du
référentiel sans participer aux **calculs de la simulation** (contrairement à
`rendement`, `UFL`, `straw_requirement`…). Elle répond à : « d'où vient cette
valeur, qui l'a produite, quand, quelle version ? ». Ce n'est **pas** une table
générique `metadata(key, value)` : chaque champ a un sens métier propre à son
tableau.

#### 2.1.2 Stockage — Option A retenue : colonnes directes dans les tables

**Option A (retenue)** : une colonne par métadonnée, dans la table de l'élément.

**Option B (rejetée)** : table générique `metadata(entity_type, entity_id,
key, value)` + jointures. Rejetée car : nouveau paradigme (contraintes
« respect de l'existant » du ticket 12), requêtes/joins plus lourds, et le
référentiel n'a qu'une poignée de types — les colonnes directes suffisent et
suivent le pattern `source` déjà en place (ticket 22).

**Point tranché — dates** : toutes les tables du référentiel possèdent déjà
`created_at` / `updated_at` (UTC, maintenus automatiquement par SQLAlchemy,
cf. `models.py`) mais **aucun** de ces deux champs n'est exposé par l'API
(`generic_views.py`) ni synchronisé vers le workspace.
➡️ **On ne crée pas** de colonnes `date_creation` / `date_modification` en
doublon : l'implémentation **expose `created_at` / `updated_at`** dans les
schémas marshmallow + `schemas/*.js` + workspace. Zéro migration pour les dates.

#### 2.1.3 Champs par type de donnée

| Type (table)                               | Champ à ajouter | Type DB           | Source                                                              | Exposé API                               | Affichage UI                                          |
| ------------------------------------------ | --------------- | ----------------- | ------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| **Baguette** (`Stic`)                      | `resume`        | `Text` (nullable) | CSV + saisie UI                                                     | `stic_fields`                            | voir « Tooltip consolidé » ci-dessous (demande devis) |
| **Site** (`Site`)                          | `description`   | `Text` (nullable) | CSV + saisie UI                                                     | `site_fields`                            | —                                                     |
| **Année climatique** (`ClimaticYear`)      | `description`   | `Text` (nullable) | CSV + saisie UI                                                     | `climatic_year_fields`                   | —                                                     |
| **Type de ration** (`FeedType`)            | `description`   | `Text` (nullable) | CSV + saisie UI                                                     | `feed_type_fields`                       | —                                                     |
| **Aliment concentré** (`ConcentratedFeed`) | `description`   | `Text` (nullable) | CSV + saisie UI                                                     | `concentrated_feed_fields`               | —                                                     |
| Tous                                       | —               | —                 | déjà là (ticket 22 : `Stic.source` ; CSV `source` sur les 4 autres) | **à exposer** `source` si manquant       | inclus dans le tooltip                                |
| Tous                                       | —               | —                 | déjà là (`models.py`, maintenus par SQLAlchemy)                     | **à exposer** `created_at`, `updated_at` | inclus dans le tooltip (`updated_at`)                 |

**Nom de colonne tranché** : `resume` (pas `description`) pour les **baguettes**
seules — c'est le nom demandé par le devis (« un champ résumé ») ;
`description` pour les autres types.

**Source des types de ration / aliments concentrés — nuance d'implémentation
(2026-11-24)** : dans le mapping existant, `source` est mapée sur la relation
`NutritionalValues` (partagée entre FeedType / ConcentratedFeed / PastureType),
**pas** sur l'entité elle-même. Le tooltip d'un type de ration / d'un concentré
lit donc `source` sur `nutritional_values.source` (comportement existant,
inchangé) ; le tooltip baguette / site / année climatique lit `source` sur
l'entité. Aucun changement de mapping requis.

**Tooltip consolidé (tranché 2026-11-24)** : au survol du **libellé** de chaque
élément du référentiel, **un seul** `v-tooltip` affichant 3 lignes :

1. **Description** (`resume` pour les baguettes) — si renseignée ;
2. **Source** — si renseignée ;
3. **Date de mise à jour** (`updated_at`, formatée `dd/mm/yyyy`) — si renseignée.
   Les lignes vides ne s'affichent pas. Pattern appliqué de façon homogène aux 5
   types (baguettes, sites, années climatiques, types de ration, aliments
   concentrés).

#### 2.1.4 « version » et « auteur » — **non retenus au périmètre de ce ticket**

- **`version`** : le référentiel n'a pas de suppression (hors périmètre, BL-2)
  ni de versioning ; la colonne `updated_at` joue déjà le rôle de « dernière
  révision ». Une vraie notion de version (historique des valeurs) serait une
  nouveauté à part entière → à ouvrir **en ticket séparé** si INRAE le demande.
- **`auteur`** : le référentiel est saisi par l'INRAE (injecteur / UI) ; la
  colonne `source` (ticket 22) trace déjà l'origine des données. Ajouter un
  « auteur » par ligne est redondant avec `source` à ce stade.

#### 2.1.5 Hors périmètre / en attente

- **Sites** (gestion complète) : à traiter dans le **ticket 20** (gestion des
  sites, ~2 j, haute) — le champ `description` du `Site` est inclus dans ce
  ticket 24 car il suit exactement le même pattern que `Stic.resume`, mais la
  gestion complète des sites (ajout/suppression) reste au ticket 20.
- **Doc injecteur** : écrite en parallèle par l'INRAE (voir §2.3).

### 2.2 Champ « résumé » pour les baguettes

1. **Backend** :
   - Ajouter la colonne `resume` dans `fichier_baguettes_fourrage.csv` (nom tranché en §2.1.3).
   - Mapper `resume` → `Stic.resume` dans le mapping.
   - Ajouter la colonne `resume` dans le modèle `Stic` + migration.
2. **Frontend** :
   - Ajouter `resume` dans le schéma `stic.js`.
   - Afficher le résumé dans un `v-tooltip` au survol du nom de la baguette
     (dans `SticModal.vue` ou le tableau des baguettes).
   - Ajouter un champ `resume` (textarea) dans le formulaire de création de baguette.

### 2.3 Documentation de l'injecteur

1. **Créer un fichier** `documentation/injecteur_referentiel.md` :
   - Description de l'injecteur (script Python, commande d'exécution).
   - Format des CSV attendus (colonnes, types, exemples).
   - Procédure d'injection (étapes, rollback).
   - Erreurs courantes et dépannage.

## 3. Fichiers impactés

| Fichier                                                        | Changement                      |
| -------------------------------------------------------------- | ------------------------------- |
| `services/backend/referential/fichier_baguettes_fourrage.csv`  | Ajouter colonne `resume`        |
| `services/backend/referential/mapping_baguettes_fourrage.json` | Mapper `resume` → `Stic.resume` |
| `services/backend/project/repository/models.py`                | Ajouter `resume` dans `Stic`    |
| `services/backend/migrations/versions/...`                     | Migration alembic               |
| `services/frontend/ui/src/schemas/stic.js`                     | Ajouter `resume`                |
| `services/frontend/ui/src/components/parts/herd/SticModal.vue` | Champ `resume` + tooltip        |
| `documentation/injecteur_referentiel.md` (nouveau)             | Doc de l'injecteur              |

> Périmètre étendu par la spec §2.1 (à valider) : colonnes `description` sur
> `Site` / `ClimaticYear` / `FeedType` / `ConcentratedFeed` (CSV + mapping +
> modèle + migration + schémas frontend + modals), et exposition API de
> `created_at` / `updated_at` (et `source` si non exposé) — sans nouvelle
> migration pour les dates (colonnes existantes).

## 4. Critères d'acceptation

1. L'utilisateur peut saisir un **résumé** pour une baguette (textarea).
2. Le résumé est affiché au **survol** du nom de la baguette (tooltip).
3. Une **documentation** de l'injecteur est disponible (`documentation/injecteur_referentiel.md`).

> **Hors périmètre** (backlog [BL-2](BACKLOG.md)) : suppression des éléments du
> référentiel (endpoints `DELETE` + contraintes + UI).

## 5. Risques / points d'attention

- **Injection** : l'injecteur est un script externe → documenter clairement le
  format des CSV pour éviter les erreurs.
- **Rétrocompatibilité** : les colonnes ajoutées (`resume`, `source`) doivent être
  optionnelles (valeurs par défaut = vide).

## 6. Estimation

| Bloc                                                                          | Effort     |
| ----------------------------------------------------------------------------- | ---------- |
| Champ « résumé » baguette (backend + frontend)                                | ~0,5 j     |
| Métadonnées étendues (spec §2.1 : `description` ×4 + exposition dates/source) | ~0,5 j     |
| Documentation injecteur                                                       | ~0,5 j     |
| **Total**                                                                     | **~1,5 j** |

> Suppression référentiel : ~1 j → backlog [BL-2](BACKLOG.md).

## 7. Implémentation (2026-11-24)

### 7.1 Backend

- `models.py` : `Stic.resume` (Text) ; `Site` / `ClimaticYear` / `FeedType` /
  `ConcentratedFeed` + `description` (Text).
- Migration alembic `7c4b9e12f0a3` (révisée après `d3f8a21c9b4e` du ticket 22).
- `generic_views.py` : exposition `resume` / `description` / `source` (si
  manquant) / `updated_at` / `created_at` dans les schémas `stic`, `site`,
  `climatic_year`, `feed_type`, `concentrated_feed`.
- Mappings : `resume → resume` (`mapping_baguettes_fourrage.json`) ;
  `description → description` (`mapping_all.json` sur sites, années climatiques,
  types de ration, aliments concentrés).
- CSV (réels + exemples) : colonne `resume` (baguettes) / `description`
  (4 autres types) ajoutée, vide par défaut. Attention : les baguettes CSV
  avaient des lignes de 38/39 colonnes (source parfois absente) → normalisé à
  39 colonnes uniformes.

### 7.2 Frontend

- `schemas/stic.js` : + `resume`.
- Composant global `components/base/MetadataTooltip.vue`
  (`BaseMetadataTooltip`, auto-registré par `plugins/base.js`) : tooltip
  consolidé description + source + date MAJ (formatée `fr-FR`) ; lignes vides
  non affichées ; fallback simple (sans tooltip) si aucune métadonnée.
- i18n `fr.json` : `metadata.source`, `metadata.updatedAt`,
  `stic.create.dialog.resume`.
- `SticModal.vue` : champ `resume` (textarea) ; tooltips sur les selects site
  / année climatique.
- `Content.vue` (workspace, tab baguettes) : tooltip sur le nom de la baguette.
- `ClassicFeed.vue` / `ConcentratedFeed.vue` (Troupeau) : tooltip sur le
  libellé de l'aliment (`item.type.name`) — source lue sur l'entité ou,
  en fallback, sur `nutritional_values.source` (mapping existant).

### 7.3 Tests

- `tests/unit/vuex/metadata.spec.js` (nouveau) : **9/9**
  - métadonnées conservées par `classicFeedList` / `sticList` (référentiel +
    custom) ;
  - robustesse legacy/custom sans métadonnées ;
  - garde-fou `getBatchConsumption` indépendant des métadonnées ;
  - computed `BaseMetadataTooltip` (hasContent, updatedLabel, dates invalides).

### 7.4 Points d'attention / restants

- **Build** : `npm run build` échoue sur des erreurs `no-console`
  **pré-existantes** (`DownloadFile.vue`, `Farm.vue`, `Report.vue`) — non liées
  à ce ticket (mêmes erreurs sur master).
- **Doc injecteur** : faite par l'INRAE dans
  `documentation/technique/injecteur-referentiel.md` (non commitée, travail
  utilisateur).
- **À vérifier en recette** : tooltips sur les 5 types (baguette, site, année
  climatique, type de ration, concentré) avec des données référentielles
  renseignées (re-seed des CSV après ajout des colonnes).
