# Ticket 4 — Troupeau → Présence : bouton « AJOUTER » inutile

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §4.
> Statut : **✅ Implémenté (2026-11-17)** · Priorité : **basse** · Type : correction (UI)
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Le bouton « AJOUTER » vient du composant générique `PeriodLayout`

Le bouton n'est **pas** dans `HousingDetails.vue` (l'onglet Présence). Il est dans le
composant générique de layout par période :

`src/components/base/PeriodLayout.vue` (L48-54) :

```html
<v-btn :color="pageColor" @click="$emit('add-modal')" outlined>
  {{ $t('btn.add') }}
</v-btn>
```

Ce bouton est affiché **systématiquement** dans le toolbar de chaque période, pour
**chaque** composant qui utilise `base-period-layout` :

- `HousingDetails.vue` (Présence) — **sans** `@add-modal` (le bouton n'a aucune action),
- `ClassicFeed.vue` (Aliments) — avec `@add-modal="openModal(...)"` (ajout d'un aliment),
- `ConcentratedFeed.vue` (Concentrés) — avec `@add-modal="openModal(...)"`.

### 1.2 Pourquoi le bouton est « inutile » sur l'onglet Présence

La présence se gère par **case par période** : deux champs (`animalCount` nb animaux,
`days` durée 0-28 j) directement dans le slot `tab-item` de `HousingDetails.vue`. Il n'y a
pas de notion d'« ajouter une présence » — chaque période a déjà sa case. Le bouton
« AJOUTER » n'a donc pas de sens ici, et **ne fait rien** (pas de `@add-modal` lié).

## 2. Recommandation ✅ **Implémenté (2026-11-17)**

**Retirer le bouton « AJOUTER » de l'onglet Présence** sans impacter Aliments/Concentrés.

**Préco** : rendre le bouton **conditionnel** dans `PeriodLayout.vue` via une prop
booléenne `showAddButton` (default `true`) :

```html
<v-btn
  v-if="showAddButton !== false"
  :color="pageColor"
  @click="$emit('add-modal')"
  outlined
>
  {{ $t('btn.add') }}
</v-btn>
```

Puis dans `HousingDetails.vue` : `<base-period-layout ... :showAddButton="false">`.

**Alternatives** (si on veut aller plus loin, optionnel) :

- masquer aussi le bouton de duplication (`base-duplicate-modal`) sur Présence si jugé
  inutile (à valider avec INRAE) ;
- ou retirer le bouton de `PeriodLayout` et le remonter explicitement dans
  `ClassicFeed.vue` / `ConcentratedFeed.vue` (plus verbeux, mais plus explicite).

➡️ **Préco retenue** : prop `showAddButton` (minimal, réversible, zéro impact sur les
autres écrans).

## 3. Fichiers impactés

| Fichier                                                             | Changement                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `services/frontend/ui/src/components/base/PeriodLayout.vue`         | prop `showAddButton` (default `true`) + `v-if` sur le bouton |
| `services/frontend/ui/src/components/parts/herd/HousingDetails.vue` | `:showAddButton="false"` sur `base-period-layout`            |

## 4. Critères d'acceptation

1. L'onglet **Présence** d'un lot n'affiche **plus** le bouton « AJOUTER ».
2. Les onglets **Aliments** et **Concentrés** continuent d'afficher le bouton
   « AJOUTER » fonctionnel (ajout d'un aliment / concentré).
3. Pas d'impact sur la duplication par période (`base-duplicate-modal`).

## 5. Risques

- Faible : composant générique — vérifier qu'aucun autre usage de `PeriodLayout` ne
  dépend du bouton (à ce jour : seuls `HousingDetails`, `ClassicFeed`, `ConcentratedFeed`).

## 6. Estimation

| Bloc                                         | Effort     |
| -------------------------------------------- | ---------- |
| Prop `showAddButton` + `v-if` (PeriodLayout) | ~0,1 j     |
| `:showAddButton="false"` (HousingDetails)    | ~0,05 j    |
| Vérif Aliments/Concentrés inchangés          | ~0,05 j    |
| **Total**                                    | **~0,2 j** |
