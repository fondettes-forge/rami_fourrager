# Ticket 23 — Feedback login (erreur / user inexistant)

> **Provenance** : Devis 2025 (R38) — item hors devis numéroté
> Statut : **à traiter** · Priorité : **moyenne** · Type : bug UX
> Date de l'analyse : 2026-11-18

---

## 1. Analyse

### 1.1 La demande

> Il ne se passe rien sur le formulaire de login si erreur ou si user inexistant.

### 1.2 État actuel

Quand l'utilisateur soumet le formulaire de login avec un identifiant ou un mot de
passe incorrect, **aucun message d'erreur** n'est affiché. Le formulaire reste
silencieux, ce qui est confusing.

## 2. Recommandation

1. **`auth.js`** (store) :
   - Vérifier que l'action `login` gère les erreurs (HTTP 401, 403, etc.) et
     stocke le message d'erreur dans le state (ex. `state.error`).
2. **`Login.vue`** (UI) :
   - Afficher un `v-alert` avec le message d'erreur si `state.error` est défini.
   - Textes possibles :
     - « Identifiant ou mot de passe incorrect. »
     - « Utilisateur inexistant. »
   - Réinitialiser l'erreur à chaque nouvelle soumission.
3. **`fr.json`** : ajouter les libellés des erreurs.

## 3. Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/store/modules/auth.js` | Gérer les erreurs de login |
| `src/views/auth/Login.vue` | Afficher le message d'erreur |
| `src/locales/fr.json` | Libellés d'erreur |

## 4. Critères d'acceptation

1. Si l'identifiant ou le mot de passe est incorrect, un message d'erreur
   s'affiche sur le formulaire de login.
2. Le message est clair (« Identifiant ou mot de passe incorrect »).
3. L'erreur est réinitialisée quand l'utilisateur resoumet le formulaire.

## 5. Estimation

| Bloc | Effort |
|------|--------|
| Gérer les erreurs (store) | ~0,2 j |
| Afficher le message (UI) | ~0,2 j |
| i18n | ~0,1 j |
| **Total** | **~0,5 j** |
