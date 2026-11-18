# Ticket 15 — AnimalProfileModal : select batch_type + rafraîchissement des profils

> Source : TODO dans `src/views/workspace/AnimalProfileModal.vue` L260.
> Statut : **à traiter** · Priorité : **moyenne** · Type : bug / correction
> Date de l'analyse : 2026-11-17

---

## 1. Analyse

### 1.1 Le TODO

```js
// TODO remettre le select de batch_type à blanc pour la création
// attention lorsque je modifie le type d'animaux, le select se recharge avec les profiles correspondants
// un problème de réfraichissement de la liste des profiles
```

### 1.2 Ce que ça signifie

Deux problèmes distincts dans le modal de profil animal (`AnimalProfileModal.vue`) :

**Problème A — Select `batch_type` non réinitialisé à la création**

Quand on ouvre le modal en **mode création** (pas d'`item`), le select `batch_type`
garde la valeur de la **dernière** ouverture (mode édition ou création précédente).
➡️ Il faut le **remettre à blanc** (valeur `null`/`''`) quand le modal s'ouvre en
création.

**Problème B — Rafraîchissement de la liste des profils quand `batch_type` change**

Quand l'utilisateur change le `batch_type` (ex. vache laitière → vache allaitante),
le select des **profils animaux** (`animalProfileList`) doit se **rafraîchir** pour
n'afficher que les profils correspondant au nouveau `batch_type`.

Le getter `animalProfileList` (`referential.js` L148) filtre déjà par `batchTypeId` :
```js
animalProfileList: (state, getters, rootState) => (batchTypeId) => {
  var list = state.animal_profiles
  if (rootState.workspace.workspace.animalProfiles.length > 0) {
    list = mergeLists([...state.animal_profiles], [...rootState.workspace.workspace.animalProfiles])
  }
  return list.filter((ap) => ap.batch_type_id === batchTypeId)
}
```

➡️ Le getter est **correct** (filtre par `batchTypeId`). Le problème est côté
**UI** : le select des profils ne se met pas à jour quand `batch_type` change
(probablement un `watch` manquant ou un `computed` qui ne re-dépend pas de
`batch_type`).

### 1.3 Résumé

| # | Problème | Où | Impact |
|---|----------|----|--------|
| A | Select `batch_type` non réinitialisé à la création | `AnimalProfileModal.vue` (watch `item` / `data`) | l'utilisateur voit un `batch_type` résiduel |
| B | Liste des profils ne se rafraîchit pas quand `batch_type` change | `AnimalProfileModal.vue` (watch / computed) | profils incohérents avec le `batch_type` sélectionné |

---

## 2. Recommandations (plan de correction)

### 2.1 Problème A — Réinitialiser `batch_type` à la création

Dans le `watch` sur `item` (ou dans le `data`/`created`), quand `item` est `null`
(mode création), **réinitialiser** le `batch_type` à `null`/`''` :

```js
watch: {
  item: {
    immediate: true,
    handler(newValue) {
      if (newValue != null) {
        this.profileItem = newValue  // mode édition
      } else {
        this.profileItem = { /* valeurs par défaut */ }
        this.batchType = null  // ← réinitialiser
      }
    },
  },
}
```

### 2.2 Problème B — Rafraîchir la liste des profils quand `batch_type` change

S'assurer que le computed qui fournit la liste des profils **dépend** de
`batch_type` :

```js
computed: {
  availableProfiles() {
    if (!this.batchType) return []
    return this.animalProfileList(this.batchType)  // getter filtré par batchTypeId
  },
}
```

Et que le `v-select` des profils utilise `availableProfiles` (pas une liste
statique). Si le `v-select` des profils a un `:items` qui ne dépend pas de
`batchType`, il faut le corriger.

**Vérifier** aussi que le `v-select` du profil est **désactivé** ou **vidé**
quand `batch_type` n'est pas sélectionné (pour éviter la sélection d'un profil
sans `batch_type`).

---

## 3. Fichiers impactés (récap)

| Fichier | Changement |
|---------|-----------|
| `src/views/workspace/AnimalProfileModal.vue` | réinitialiser `batch_type` à la création (A) ; s'assurer que la liste des profils dépend de `batch_type` (B) |

---

## 4. Critères d'acceptation

1. À l'ouverture du modal en **création**, le select `batch_type` est **à blanc**
   (pas de valeur résiduelle).
2. Quand l'utilisateur change le `batch_type`, la liste des **profils animaux**
   se **rafraîchit** immédiatement (uniquement les profils du nouveau `batch_type`).
3. Le select des profils est **désactivé** ou **vide** tant que `batch_type`
   n'est pas sélectionné.

## 5. Risques / points d'attention

- **Ne pas casser le mode édition** : quand on édite un profil existant, le
  `batch_type` et le profil doivent être **pré-remplis** (pas réinitialisés).
- **Getter `animalProfileList`** : il est déjà correct (filtre par `batchTypeId`).
  Le problème est côté UI (watch/computed), pas côté getter.
- **Cartes custom** (`workspace.animalProfiles`) : le getter `animalProfileList`
  fusionne déjà les profils custom (via `mergeLists`, ticket 1). Vérifier que le
  fix ne casse pas la fusion.

## 6. Estimation

| Bloc | Effort |
|------|--------|
| Réinitialiser `batch_type` à la création (A) | ~0,25 j |
| Rafraîchissement liste profils (B) | ~0,25 j |
| Tests / validation | ~0,25 j |
| **Total** | **~0,75 j** |
