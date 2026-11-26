# Injecteur du référentiel — Procédure de chargement des CSV

> Document de référence pour la charge du référentiel (sites, années climatiques,
> baguettes, types, profils animaux…) à partir des CSV de
> `services/backend/referential/`.
>
> Implémentation : [`services/backend/project/repository/seeder.py`](../../services/backend/project/repository/seeder.py)
> Point d'entrée : `manage.py seed <mapping.json>`
>
> Mise à jour : 2026-11-25.

---

## 1. Vue d'ensemble

Le référentiel n'est **pas** géré via l'interface : il est chargé par un
**script d'injection (seeder)** qui lit des fichiers CSV, les mappe vers les
modèles SQLAlchemy du référentiel, et insère/met à jour les lignes en base.

```
services/backend/
├── manage.py                      # CLI (create, init_db, add_admin_user, seed)
└── referential/
    ├── fichier_sites.csv          # 25 sites
    ├── fichier_annees_climatique.csv
    ├── fichier_periods.csv        # 13 périodes (P1 → P13)
    ├── fichier_type_logement.csv
    ├── fichier_type_animaux.csv   # codes lots (VL, GEN, VA broutard…)
    ├── fichier_type_pature.csv    # + valeurs nutritives
    ├── fichier_type_ration.csv    # fourrages (P, FH, EH, EM… + valeurs)
    ├── fichier_aliments_concentres.csv
    ├── fichier_baguettes_fourrage.csv   # 2 429 baguettes (STIC)
    ├── fichier_profil_animaux.csv       # 429 profils + CI/UFL/PDI/PL par période
    ├── mapping_all.json           # ← 8 fichiers « simples » (tout sauf baguettes/profils)
    ├── mapping_baguettes_fourrage.json  # ← fichier baguettes seul
    └── mapping_animal_profil.json       # ← fichier profils seul
        (+ mapping_test.json, exemple_*.csv non utilisés en prod)
```

### Modèles cibles

Définis dans [`project/repository/referentials/models.py`](../../services/backend/project/repository/referentials/models.py)
: `Period`, `SticPeriod`, `Stic`, `Site`, `ClimaticYear`, `PastureType`,
`ConcentratedFeed`, `FeedType`, `NutritionalValues`, `AnimalProfilePeriod`,
`AnimalProfile`, `BatchType`, `HousingType`.

### Modèles « pivot » (1 ligne CSV → N lignes DB)

| Pivot                 | Ligne 1 CSV                                         | Lignes DB                       |
| --------------------- | --------------------------------------------------- | ------------------------------- |
| `SticPeriod`          | 1 baguette (13 colonnes `P1…P13` + `M1…M13`)        | jusqu'à 13 × (production, mode) |
| `AnimalProfilePeriod` | 1 profil (13 colonnes `CI*`, `UFL*`, `PDI*`, `PL*`) | jusqu'à 13 × (CI, UFL, PDI, PL) |

Le seeder est **idempotent** : à chaque exécution, un objet existant
(identifié par ses contraintes d'unicité) est **mis à jour** s'il a changé,
sinon conservé. **Aucune suppression** : une ligne retirée du CSV reste en
base (voir §7).

---

## 2. Prérequis

1. **Stack Docker** : `make build` (build + `docker compose up -d`), ou
   `make start` si les images existent déjà. Le `.env` racine est chargé par le
   Makefile (variables `DATABASE_URL`, `FLASK_ENV`, `APP_SETTINGS`…).
2. **Base initialisée** : `make fresh-db` = `manage.py create` (drop_all +
   create_all — **efface tout, ne pas utiliser sur une base existante**) +
   `manage.py init_db` (rôles `user`/`admin`).
3. **Admin** (si pas encore) : `make add-admin-dev` (utilise
   `ADMIN_USER_NAME` / `ADMIN_USER_EMAIL` / `ADMIN_USER_PWD` du `.env`).
4. Le répertoire `referential/` est monté dans le conteneur backend
   (`./services/backend/referential:/usr/src/app/referential`) — les CSV
   modifiés localement sont visibles sans rebuild.

---

## 3. Procédure de chargement

### 3.1 Commande

Via le Makefile (cible `update-*`, équivalent à
`docker compose exec backend python manage.py seed <mapping.json>`) :

```bash
make update-referential          # mapping_all.json
make update-animal-profil        # mapping_animal_profil.json
make update-baguettes-fourrage   # mapping_baguettes_fourrage.json
```

- `manage.py seed` lit le mapping JSON dans `services/backend/referential/`
  (nom sécurisé par `secure_filename`).
- Le seeder parcourt chaque CSV déclaré dans le mapping, ligne par ligne,
  **séquentiellement** (le mode asyncio est présent mais commenté).
- Une erreur bloquante (fichier absent, JSON invalide, erreur SQL) déclenche
  un `rollback` et retourne `(False, err)`.
- Les **erreurs de conversion** d'une ligne ne bloquent pas le run : la ligne
  est **rejettée** et inscrite au rapport (voir §4.3).

### 3.2 Ordre d'injection (respecter les dépendances)

Le [Makefile](../../Makefile) racine expose les cibles d'injection (elles
exécutent `manage.py seed` dans le conteneur `backend`) :

```bash
# 1. Première installation complète (build + base vide + référentiel) :
make init            # = build + fresh-db + fresh-data
#    fresh-db  : manage.py create (drop_all + create_all) + init_db
#    fresh-data: les 3 mappings, dans l'ordre de dépendance

# 2. Mise à jour du référentiel (base existante, upsert) :
make update-referential          # mapping_all.json
make update-animal-profil        # mapping_animal_profil.json
make update-baguettes-fourrage   # mapping_baguettes_fourrage.json

# 3. Réinitialisation complète (stop + volume supprimé + base + données) :
make refresh-db
```

> `mapping_all.json` ne contient **ni** baguettes **ni** profils : ils ont des
> mappings dédiés (pivots, contraintes en cascade). `fresh-data` les lance dans
> l'ordre : `mapping_all.json` → `mapping_animal_profil.json` →
> `mapping_baguettes_fourrage.json`.

**Dépendances à respecter** (sinon les lignes sont rejetées) :

```
sites ──► années climatiques ──► baguettes
   (required)          (required)
types animaux ──► profils animaux (required, par code)
periods  ──► pivots SticPeriod / AnimalProfilePeriod
```

Concrètement : une année climatique dont le site n'existe pas → rejet
(`required: "True"`). Une baguette dont l'année n'existe pas → rejet. Un profil
dont le code `BatchType` n'existe pas → rejet.

> **Sans Makefile** (dev locale, venv activé dans `services/backend/`) :
> `python manage.py seed mapping_all.json` puis les deux mappings dédiés —
> équivalent direct des cibles ci-dessus.

### 3.3 Vérifier après injection

- **Rapport** : la fin de sortie de la commande affiche le rapport JSON
  (`created_objects`, `modified_objects`, `rejections` par fichier) — le
  relire à chaque run.
- **Côté UI** : se connecter, vérifier le référentiel (baguettes, profils)
  synchronisé dans le workspace.
- **En base** (contrôle rapide) :
  ```sql
  SELECT count(*) FROM site;                 -- 25
  SELECT count(*) FROM climatic_year;        -- 72
  SELECT count(*) FROM period;               -- 13
  SELECT count(*) FROM stic;                 -- ≈ 2 400
  SELECT count(*) FROM animal_profile;       -- ≈ 429
  ```

---

## 4. Format du mapping JSON

Un mapping = un dictionnaire `{ fichier_csv: configuration }`. Chaque
configuration :

| Clé                      | Rôle                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `model`                  | Nom du modèle cible (classe SQLAlchemy du module `referentials`)                                       |
| `column_mapping`         | `{ colonne_csv: attribut_modèle }` — les colonnes absentes du CSV sont ignorées                        |
| `uniqueness_constraints` | `{ onParent: [...], onRelation: [...] }` — identifie l'objet existant (update vs create)               |
| `relations`              | `{ nom_relation: { model, to_fill, required, column_mapping, uniqueness_constraints } }` — objets liés |
| `has_pivot`              | `{ model, on, is_pivot: { with, on, with_mapping: [{ on_name, column_mapping }] } }` — table pivot     |

### 4.1 `relations` — `to_fill` vs `required`

- `to_fill: "True"` → si l'objet lié n'existe pas, il est **créé** (ex.
  `NutritionalValues` des fourrages : la ligne CSV porte ses valeurs).
- `to_fill: "False"` → l'objet lié **doit exister** :
  - `required: "True"` → sinon la ligne est **rejetée** ;
  - `required: "False"` → la relation reste vide (ex. `Type_pature` d'une
    baguette non-pâturée).

### 4.2 `has_pivot` — pivot

- `on` : colonne FK côté parent dans la table pivot (`stic_id`,
  `animal_profile_id`).
- `with` / `on` : modèle cible (`Period`) et colonne FK (`period_id`) — la
  période est résolue **par son `name`** (`on_name: "1"…` = période `1`…`13`).
- `with_mapping` : 13 entrées `{ on_name, column_mapping }` qui mapent les
  colonnes `P*`/`M*` (baguettes) ou `CI*/UFL*/PDI*/PL*` (profils).
- Un pivot déjà existant (même parent + même période) est **mis à jour** ;
  une période inconnue en base est ignorée avec un rejet au rapport.

### 4.3 Conversion de données

`convert_data()` convertit la valeur (toujours lue comme **string**) selon le
type de colonne du modèle :

- `int` → `int(x)` ou `0` si vide ;
- `decimal.Decimal` → virgule remplacée par `.` (les CSV acceptent
  `0,5` et `0.5`), `0` si vide ;
- `str` → `strip()` seulement.

Une valeur illisible (ex. `abc` dans une colonne numérique) → **rejet de la
ligne** avec le message `Conversion error: Unable to convert 'abc' to
<class 'decimal.Decimal'>`.

> **Piège** : les CSV de profils et baguettes utilisent la **virgule décimale**
> (`13,7`) — c'est géré. Mais si un fichier est exporté avec `;` non conforme
> (ex. un `;` dans une valeur non protégée par des guillemets), la ligne est
> tronquée sans erreur.

### 4.4 Codes générés

Si un objet a `name` et `code` mais que `code` est vide, il est généré depuis
le nom : `remove_diacritics` + minuscules + espaces → `_`
(ex. `Pâture PP` → `pature_pp`). Les modèles sans colonne `code`
(`ClimaticYear`… non, tous en ont une) — vérifier au cas par cas.

---

## 5. Détail des fichiers

### 5.1 `mapping_all.json` (8 fichiers, 8 modèles)

| Fichier CSV                       | Modèle             | Colones mappées (CSV → modèle)                                                                                                                             | Identité (`onParent`)    |
| --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `fichier_sites.csv`               | `Site`             | `site` → `name`                                                                                                                                            | `name`                   |
| `fichier_annees_climatique.csv`   | `ClimaticYear`     | `annee` → `name`                                                                                                                                           | `name` + relation `site` |
| `fichier_periods.csv`             | `Period`           | `nom` → `name`, `date_debut` → `start_at`, `date_fin` → `end_at`                                                                                           | `name`                   |
| `fichier_type_logement.csv`       | `HousingType`      | `nom` → `name`, `besoin_paille` → `straw_requirement`                                                                                                      | `name`                   |
| `fichier_aliments_concentres.csv` | `ConcentratedFeed` | `nom`, `stock_correspondant` → `correspondingStock` + `NutritionalValues` (`to_fill`)                                                                      | `name`                   |
| `fichier_type_ration.csv`         | `FeedType`         | `ration` → `name`, `stock_correspondant` + `NutritionalValues` (UEL, UEB, UEM, UFL, UFV, PDI_inf, refus, source)                                           | `name`                   |
| `fichier_type_pature.csv`         | `PastureType`      | `nom` → `name` + `NutritionalValues` (UFL, UFV, PDIN, PDIE, PDIinf, source)                                                                                | `name`                   |
| `fichier_type_animaux.csv`        | `BatchType`        | `type` → `code`, `description` → `name`, `correspondance UE`/`UF` → `UE/UF_value_considered`, `Colonne UF_concentrés` → `UF_concentrated_value_considered` | `name` + `code`          |

Colonne `Raccourci` de `fichier_type_ration.csv` : **non mappée** (ignorée).

> Les `stock_correspondant` (RC, RP, RT, FH, EH, EM, EL, FL, P, STRAW, RC-RP…)
> sont les **codes de stock** consommés par le frontend (`barnStockItems`) —
> un aliment sans `stock_correspondant` n'est pas distribuable comme stock.

### 5.2 `mapping_baguettes_fourrage.json` (modèle `Stic`)

- Colones parent : `Abrev_baguette` → `name`, `type`, `Rdt_paille` →
  `rendement`, `Designation_baguettes` → `designation`, `RU`, `IN`, `ITK`,
  `Détail_ITK` → `detail_ITK`, `source`.
- Identité : `name` + `type` **+ relation** `climatic_year` (`annee` → `name`,
  elle-même identifiée par `site`) — c'est-à-dire **une baguette = 1 site +
  1 année + 1 nom + 1 type**.
- Relations : `climatic_year` (required), `pasture_type` (optionnelle, par
  `Type_pature`).
- Pivot : `SticPeriod` (13 périodes, `P*` → `production`, `M*` →
  `farming_method`).

### 5.3 `mapping_animal_profil.json` (modèle `AnimalProfile`)

- Colones parent : `Description` → `name`, `Periode_MB`, `Age_mois`,
  `Sem_MB`, `Poids_MB_kg`, `NEC_MB`, `Duree_lact_j` → `lactation_duration`,
  `Poids_anx_naiss_kg`, `Product_lait_kg`, `TR`.
- Identité : `name` (la `Description` est donc l'identifiant — **ne pas la
  dupliquer**).
- Relation : `batch_type` par `Type` → `code` (required) — le code `Type`
  doit exister dans `fichier_type_animaux.csv`.
- Pivot : `AnimalProfilePeriod` (13 périodes, `CI*`/`UFL*`/`PDI*`/`PL*`).

---

## 6. Journal d'exécution & rejets

À la fin du run, la sortie contient :

```
Final report :
{
  "fichier_baguettes_fourrage.csv": {
    "total_rows": 2429,
    "created_objects": 0,
    "modified_objects": 0,
    "created_related_objects": 0,
    "modified_related_objects": 0,
    "created_pivot_objects": 0,
    "modified_pivot_objects": 0,
    "rejections": [
      {
        "message": "can't map data on row 42",
        "error": "Conversion error: Unable to convert 'abc' to <class 'decimal.Decimal'>",
        "csv_row": {...}
      }
    ]
  }
}
```

Types de rejets :

| `message`                                              | Cause                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `can't map data on row N`                              | conversion impossible (numérique invalide, attribut absent du modèle) |
| `can't get parent object in row N`                     | erreur SQL lors de la recherche de l'objet                            |
| `can't get related object : X in row N`                | relation `to_fill: False` + `required: True` non satisfaite           |
| `Target object with name 'X' does not exist. in row N` | période du pivot inconnue en base                                     |
| `can't create pivot in row N`                          | erreur pivot (doublon, FK…)                                           |

> ⚠️ Un run avec des rejets est quand même **partiellement commité** (commit
> ligne à ligne). Corriger les lignes fautives puis relancer — les lignes
> correctes seront trouvées à jour (aucun double-commit).

---

## 7. Ajout / mise à jour d'un élément du référentiel

### 7.1 Ajouter un site / une année climatique

1. Ajouter la ligne dans le CSV concerné.
2. `make update-referential` (puis les cibles qui en dépendent si besoin).

### 7.2 Ajouter un type (ration, pâture, logement, animal, aliment)

1. Ligne dans le CSV + colonnes de valeurs nutritives complètes.
2. Si la valeur doit être **distribuée en stock** : renseigner
   `stock_correspondant` (code connu du frontend — sinon ajouter le code dans
   `referential.js` côté frontend + `mixins.js`).
3. `make update-referential`.

### 7.3 Ajouter une baguette

1. Ligne dans `fichier_baguettes_fourrage.csv` : `site` + `annee` existants,
   `Abrev_baguette` unique par (site, année, type), colonnes `P1…P13` /
   `M1…M13` (production en qtx/ha, mode `P`/`FH`/`EH`/`EM`…).
2. `make update-baguettes-fourrage`.

### 7.4 Modifier une valeur existante

Le seeder est un **upsert** : changer la valeur dans le CSV et relancer la
cible correspondante (`make update-*`) → la ligne est mise à jour
(`modified_objects` +1). La colonne `updated_at` est rafraîchie (utilisée par
la synchronisation incrémentale du frontend, `get_all(model,
lastConnectionDate)`).

### 7.5 Retirer un élément

**Pas de suppression** : retirer la ligne du CSV n'a **aucun effet** en base
(le seeder n'efface jamais). Les options actuelles :

- **Suppression manuelle en base** (à éviter sans analyse des FK :
  `Stic`/`ClimaticYear` utilisés par des simulations, `NutritionalValues`
  partagées) ;
- **Backlog [BL-2](../projet/tickets/BACKLOG.md)** : suppression référentiel
  via l'API (endpoints `DELETE` + contraintes + UI), à implémenter.

---

## 8. Erreurs fréquentes & dépannage

| Symptôme                                                     | Cause probable                                                               | Correction                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| `FileNotFoundError: The mapping file ... is not found`       | mauvais nom de mapping (doit exister dans `referential/`)                    | vérifier le nom exact (`mapping_all.json`…)         |
| `Value error: The model X does not exist`                    | `model` du mapping ne correspond à aucune classe de `referentials/models.py` | corriger le mapping                                 |
| `can't get related object : climatic_year in row N`          | l'année (ou site) de la ligne baguette n'est pas en base                     | injecter d'abord `mapping_all.json` (sites, années) |
| `Conversion error: Unable to convert '…' to decimal.Decimal` | valeur textuelle dans une colonne numérique (ou `;` mal protégé)             | corriger la cellule CSV                             |
| Run très lent                                                | 2 429 baguettes × contraintes en cascade = requêtes N+1                      | normal ; laisser tourner (~1 à 2 min)               |
| UI ne voit pas la mise à jour                                | le store frontend cache le référentiel                                       | recharger le workspace / re-synchroniser            |
| `sqlalchemy.exc.OperationalError`                            | `DATABASE_URL` absente / Postgres down                                       | vérifier l'environnement et le conteneur `db`       |

---

## 9. Points d'attention / dette

1. **Pas de suppression** (voir §7.5) — le référentiel n'augmente que.
   → BL-2.
2. **Pas de validation de schéma** : une colonne manquante dans le CSV ne
   provoque pas d'erreur, elle est simplement ignorée (`if csv_column in row`)
   → risque de champ vide silencieux.
3. **`mapping_test.json`** et les `exemple_*.csv` sont du ballast dans le
   répertoire (non référencés par `manage.py`).
4. **Colonnes non mappées** : `Raccourci` (rations), `Type` (baguettes est
   mappé, profils non — le `Type` des profils est seulement utilisé pour la
   relation `batch_type`). Documenter si on veut les exploiter.
5. **Codes de stock** (`stock_correspondant`) : source de vérité partagée avec
   le frontend (`barnStockItems` de `referential.js`). Toute valeur exotique
   (ex. `RC-RP` pour les mélanges) doit être gérée côté frontend.
6. **`manage.py create`** droppe toute la base — réservé à la dev initiale.
7. Le rapport est affiché en `print` (pas de logger) — voir le TODO
   `TODO-BACK` dans `manage.py`.

---

## 10. Références

- Code : [`seeder.py`](../../services/backend/project/repository/seeder.py)
  (`mapper`, `mapData`, `getObj`, `isUpToDate`, `updateObj`, `createPivot`,
  `makeSeed`, `seeder`), [`manage.py`](../../services/backend/manage.py)
  (commande `seed`), [`models.py`](../../services/backend/project/repository/referentials/models.py).
- Synchronisation frontend : `store/modules/referential.js`
  (récupération incrémentale par `updated_at`).
- Ticket associé (doc injecteur) : [ticket 24](../projet/tickets/ticket-24-metadata-referentiel.md)
  §2.2 — cette doc en constitue la partie « doc injecteur ».
- Suppression référentiel : [BACKLOG.md — BL-2](../projet/tickets/BACKLOG.md).
