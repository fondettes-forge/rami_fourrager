# Ticket 18 — Tooltip « nb génisses à garder »

> **Provenance** : Devis 2025 (R11) — `2025081802D_devis_Antoine_Savoie_inrae_correctifs`
> Statut : **✅ Implémenté** · Priorité : **basse** · Type : correction UX
> Date de l'analyse : 2026-11-18 · Mise à jour : 2026-11-18 (implémenté)

---

## Implémentation (2026-11-18)

- `HerdModal.vue` (création de lot) : `v-tooltip` + icône `mdi-help-circle-outline`
  sur le champ « Nombre d'animaux ».
- `BatchDetails.vue` (édition de lot) : idem.
- `fr.json` : clés `herd.modal.count_tooltip` + `herd.details.count_tooltip`.
- Le tooltip s'affiche au survol de l'icône d'aide (pas conditionnel au type de
  lot — le texte est explicite « Pour un lot de génisses : … »).

---

## 1. Analyse

### 1.1 La demande

> Ajouter une info-bulle pour expliquer que « le nombre de génisse à saisir est le
> nombre de génisse qu'on garde » (qu'on met à la reproduction). Le nombre total de
> génisse est donc supérieur. C'est ce qui explique qu'on a un nombre d'animaux
> total supérieur.

### 1.2 État actuel

Le champ « nombre de génisses » dans le formulaire de création de profil animal
n'a pas d'info-bulle d'explication. L'utilisateur ne sait pas qu'il doit saisir le
nombre de génisses **gardées** (mises à la reproduction), pas le nombre total.

## 2. Recommandation

1. **`AnimalProfileModal.vue`** :
   - Ajouter un `v-tooltip` sur le label du champ « nombre de génisses ».
   - Texte du tooltip : « Le nombre de génisses à saisir est le nombre de génisses
     que vous gardez (mises à la reproduction). Le nombre total de génisses est
     donc supérieur (génisses vendues + génisses gardées). »
2. **`fr.json`** : ajouter la clé i18n pour le texte du tooltip.

## 3. Fichiers impactés

| Fichier                                            | Changement                                |
| -------------------------------------------------- | ----------------------------------------- |
| `src/components/parts/herd/AnimalProfileModal.vue` | Ajouter `v-tooltip` sur le champ génisses |
| `src/locales/fr.json`                              | Clé i18n pour le texte du tooltip         |

## 4. Critères d'acceptation

1. En survolant le label « nombre de génisses », un tooltip s'affiche avec
   l'explication.
2. Le texte est clair et explique la différence entre « génisses gardées » et
   « génisses totales ».

## 5. Estimation

| Bloc                        | Effort     |
| --------------------------- | ---------- |
| Ajouter `v-tooltip` + texte | ~0,1 j     |
| **Total**                   | **~0,1 j** |

> ✅ Fait le 2026-11-18 (~0,1 j, comme estimé).
