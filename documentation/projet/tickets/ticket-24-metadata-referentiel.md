# Ticket 24 — Métadonnées référentiel (+ résumé baguette, doc injecteur, suppression)

> **Provenance** : Devis 2025 (R40) — item hors devis numéroté
> Statut : **à traiter** · Priorité : **haute** · Type : nouvelle fonctionnalité
> Date de l'analyse : 2026-11-18

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

### 2.1 Champ « résumé » pour les baguettes

1. **Backend** :
   - Ajouter la colonne `resume` (ou `description`) dans `fichier_baguettes_fourrage.csv`.
   - Mapper `resume` → `Stic.resume` dans le mapping.
   - Ajouter la colonne `resume` dans le modèle `Stic` + migration.
2. **Frontend** :
   - Ajouter `resume` dans le schéma `stic.js`.
   - Afficher le résumé dans un `v-tooltip` au survol du nom de la baguette
     (dans `SticModal.vue` ou le tableau des baguettes).
   - Ajouter un champ `resume` (textarea) dans le formulaire de création de baguette.

### 2.2 Suppression des éléments du référentiel

1. **Backend** :
   - Ajouter des endpoints `DELETE` pour les modèles du référentiel (Stic, Site,
     ClimaticYear, FeedType, etc.).
   - Gérer les contraintes de suppression (ex. ne pas supprimer un Stic s'il est
     utilisé par une simulation).
2. **Frontend** :
   - Ajouter des boutons « Supprimer » dans les UI de gestion (Si le ticket 20 est
     fait, intégrer dans `SiteManager.vue`).
   - Confirmer la suppression (modal « Êtes-vous sûr ? »).

### 2.3 Documentation de l'injecteur

1. **Créer un fichier** `documentation/injecteur_referentiel.md` :
   - Description de l'injecteur (script Python, commande d'exécution).
   - Format des CSV attendus (colonnes, types, exemples).
   - Procédure d'injection (étapes, rollback).
   - Erreurs courantes et dépannage.

## 3. Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `services/backend/referential/fichier_baguettes_fourrage.csv` | Ajouter colonne `resume` |
| `services/backend/referential/mapping_baguettes_fourrage.json` | Mapper `resume` → `Stic.resume` |
| `services/backend/project/repository/models.py` | Ajouter `resume` dans `Stic` |
| `services/backend/migrations/versions/...` | Migration alembic |
| `services/backend/project/api/*/views.py` | Endpoints `DELETE` (référentiel) |
| `services/frontend/ui/src/schemas/stic.js` | Ajouter `resume` |
| `services/frontend/ui/src/components/parts/herd/SticModal.vue` | Champ `resume` + tooltip |
| `documentation/injecteur_referentiel.md` (nouveau) | Doc de l'injecteur |

## 4. Critères d'acceptation

1. L'utilisateur peut saisir un **résumé** pour une baguette (textarea).
2. Le résumé est affiché au **survol** du nom de la baguette (tooltip).
3. L'utilisateur peut **supprimer** un élément du référentiel (Stic, Site, etc.)
   si les contraintes sont respectées.
4. Une **documentation** de l'injecteur est disponible (`documentation/injecteur_referentiel.md`).

## 5. Risques / points d'attention

- **Suppression** : vérifier les contraintes (ex. ne pas supprimer un Stic utilisé
  par une simulation active). Prévoir un mécanisme de « suppression douce » (soft
  delete) si nécessaire.
- **Injection** : l'injecteur est un script externe → documenter clairement le
  format des CSV pour éviter les erreurs.
- **Rétrocompatibilité** : les colonnes ajoutées (`resume`, `source`) doivent être
  optionnelles (valeurs par défaut = vide).

## 6. Estimation

| Bloc | Effort |
|------|--------|
| Champ « résumé » (backend + frontend) | ~0,5 j |
| Suppression référentiel (endpoints + UI) | ~1 j |
| Documentation injecteur | ~0,5 j |
| **Total** | **~2 j** |
