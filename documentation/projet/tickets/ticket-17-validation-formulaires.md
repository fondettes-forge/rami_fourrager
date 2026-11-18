# Ticket 17 — Validation formulaires : champs facultatifs / obligatoires

> **Provenance** : Devis 2025 (R10) — `2025081802D_devis_Antoine_Savoie_inrae_correctifs`
> Statut : **à traiter** · Priorité : **moyenne** · Type : correction UX
> Date de l'analyse : 2026-11-18

---

## 1. Analyse

### 1.1 La demande

> Ajouter si les champs sont facultatifs ou obligatoires dans la création des
> baguettes et dans la création des profils animaux.

### 1.2 État actuel

Les formulaires de création des **baguettes** (`SticModal.vue`) et des **profils
animaux** (`AnimalProfileModal.vue`) n'indiquent pas visuellement quels champs sont
obligatoires. L'utilisateur ne sait pas quels champs il peut laisser vides.

## 2. Recommandation

1. **`SticModal.vue`** (création baguette) :
   - Marquer les champs obligatoires (ex. `name`, `type`, `surface`) avec un
     astérisque `*` ou un libellé « (obligatoire) ».
   - Ajouter des `rules` vee-validate pour bloquer la soumission si un champ
     requis est vide.
2. **`AnimalProfileModal.vue`** (création profil animal) :
   - Idem : marquer les champs obligatoires (ex. `code`, `name`, `age_mois`,
     `weight_kg`).
3. **`fr.json`** : ajouter les libellés « (obligatoire) » / « (facultatif) » si
   besoin.

## 3. Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/components/parts/herd/SticModal.vue` | Marquer champs obligatoires + `rules` |
| `src/components/parts/herd/AnimalProfileModal.vue` | Idem |
| `src/locales/fr.json` | Libellés « (obligatoire) » / « (facultatif) » |

## 4. Critères d'acceptation

1. Dans le formulaire de création de baguette, les champs obligatoires sont
   marqués (ex. `*` ou « (obligatoire) »).
2. La soumission est bloquée si un champ obligatoire est vide.
3. Idem pour le formulaire de création de profil animal.

## 5. Estimation

| Bloc | Effort |
|------|--------|
| Marquer champs obligatoires (2 formulaires) | ~0,3 j |
| Ajouter `rules` vee-validate | ~0,2 j |
| **Total** | **~0,5 j** |
