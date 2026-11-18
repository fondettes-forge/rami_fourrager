# Ticket 20 — Formulaire gestion sites (création / mise à jour / suppression)

> **Provenance** : Devis 2025 (R27) — `2025081803D_devis_Antoine_Savoie_inrae_evolution_sites`
> Statut : **à traiter** · Priorité : **haute** · Type : nouvelle fonctionnalité
> Date de l'analyse : 2026-11-18

---

## 1. Analyse

### 1.1 La demande

> Il faut affiner le comment on crée un site, ensuite on lui ajoute des années
> climatiques et enfin des baguettes. Cela implique qu'il faut aussi pouvoir créer
> /rattacher des années climatiques car j'ai un triptyque site - année climatique -
> baguettes. Il faut uniquement un formulaire pour créer site et année climatique à
> la volée. Le formulaire de création des baguettes permet déjà de changer site et
> année climatique. Il faut refaire un peu le front car ce n'est pas très explicite.
> Il faut revoir l'ergonomie du formulaire pour la copie.
>
> - Pouvoir créer son propre site (actuellement pas faisable directement par
>   l'utilisateur) : comme on peut créer une nouvelle baguette, un nouvel animal.

### 1.2 État actuel

Les **sites** et **années climatiques** sont gérés côté backend (référentiel), mais
il n'y a **pas de formulaire frontend** pour :
- Créer un nouveau site.
- Créer une nouvelle année climatique.
- Modifier / supprimer un site ou une année climatique.

Actuellement, l'utilisateur peut uniquement **choisir** un site et une année
climatique existants dans le formulaire de création de baguette (`SticModal.vue`).

## 2. Recommandation

### 2.1 Backend (à prévoir)

- **Endpoints REST** :
  - `POST /sites` : créer un site.
  - `PUT /sites/{id}` : mettre à jour un site.
  - `DELETE /sites/{id}` : supprimer un site.
  - `POST /climatic-years` : créer une année climatique (liée à un site).
  - `PUT /climatic-years/{id}` : mettre à jour.
  - `DELETE /climatic-years/{id}` : supprimer.
- **Modèles SQLAlchemy** : vérifier si `Site` et `ClimaticYear` existent déjà
  (probablement oui, dans `models.py`).

### 2.2 Frontend

1. **Créer un composant** `SiteManager.vue` :
   - Liste des sites existants (avec les années climatiques associées).
   - Bouton « Créer un site » → modal avec formulaire (nom, description).
   - Bouton « Créer une année climatique » → modal (site, nom, type normal/sèche).
   - Boutons « Modifier » / « Supprimer » sur chaque site / année.
2. **Intégrer dans l'UI** :
   - Ajouter une entrée dans le Drawer ou dans *Mes configurations*.
   - Ou : ajouter un onglet « Sites » dans la page *Mes configurations*.
3. **`SticModal.vue`** :
   - Dans le select « site », ajouter un bouton « + Créer un site » qui ouvre le
     formulaire de création.
   - Idem pour « année climatique ».

## 3. Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `services/backend/project/api/sites/views.py` (à créer) | Endpoints CRUD sites |
| `services/backend/project/api/climatic-years/views.py` (à créer) | Endpoints CRUD années |
| `services/backend/project/repository/models.py` | Vérifier/ajouter modèles `Site`, `ClimaticYear` |
| `services/frontend/ui/src/components/parts/workspace/SiteManager.vue` (nouveau) | UI gestion sites |
| `services/frontend/ui/src/views/workspace/Content.vue` | Intégrer SiteManager |
| `services/frontend/ui/src/components/parts/herd/SticModal.vue` | Boutons « Créer un site » / « Créer une année » |
| `services/frontend/ui/src/store/modules/referential.js` | Actions API pour sites/années |
| `services/frontend/ui/src/locales/fr.json` | Libellés |

## 4. Critères d'acceptation

1. L'utilisateur peut **créer un site** depuis l'UI (nom, description).
2. L'utilisateur peut **créer une année climatique** liée à un site (nom, type).
3. L'utilisateur peut **modifier** / **supprimer** un site / une année.
4. Dans le formulaire de baguette, l'utilisateur peut **créer un site** ou une
   **année climatique** à la volée (sans quitter le formulaire).
5. L'ergonomie est claire (triptyque site → année → baguette explicite).

## 5. Risques / points d'attention

- **Couplage backend** : nécessite des endpoints + probablement une migration si
  les modèles n'existent pas.
- **Suppression d'un site** : vérifier les contraintes (baguettes liées, simulations).
- **Performance** : la liste des sites / années peut être longue → prévoir la
  pagination ou la recherche.

## 6. Estimation

| Bloc | Effort |
|------|--------|
| Backend (endpoints + modèles) | ~0,5 j |
| Frontend (SiteManager + intégration) | ~1 j |
| UX (boutons « Créer » dans SticModal) | ~0,5 j |
| **Total** | **~2 j** |
