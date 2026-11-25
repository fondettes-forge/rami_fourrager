# Ticket 21 — Duplication de simulation (« Enregistrer-sous »)

> **Provenance** : Devis 2025 (R29) — `2025081804D_devis_Antoine_Savoie_inrae_evolution_simulation`
> Statut : **✅ Implémenté** (2026-11-25) · Priorité : **moyenne** · Type : nouvelle fonctionnalité
> Date de l'analyse : 2026-11-18

---

## 1. Analyse

### 1.1 La demande

> Pouvoir « Enregistrer-sous » une simulation pour en faire une variante, dupliquer
> une simulation.

### 1.2 État actuel

L'utilisateur peut créer une nouvelle simulation, mais pas **dupliquer** une
simulation existante pour en faire une variante (ex. tester un scénario différent
à partir d'une simulation de base). Il doit recréer toute la simulation à la main.

## 2. Recommandation

1. **`workspace.js`** (store) :
   - Ajouter une action `duplicateSimulation(simulation, newName)` :
     - Copie profonde de la simulation (farm, barn, herd, report).
     - Change le nom (ex. `« Nom original » (copie)` ou nom saisi par l'utilisateur).
     - Ajoute la copie dans `workspace.simulations`.
2. **`Content.vue`** (UI) :
   - Dans la liste des simulations, ajouter un bouton « Dupliquer » (icône
     `mdi-content-copy`) sur chaque simulation.
   - Au clic : ouvrir un modal avec un champ « Nom de la copie » (pré-rempli avec
     `« Nom original » (copie)`).
   - Appeler `duplicateSimulation` et rafraîchir la liste.
3. **`fr.json`** : ajouter les libellés (« Dupliquer », « Nom de la copie »).

## 3. Fichiers impactés

| Fichier                           | Changement                   |
| --------------------------------- | ---------------------------- |
| `src/store/modules/workspace.js`  | Action `duplicateSimulation` |
| `src/views/workspace/Content.vue` | Bouton « Dupliquer » + modal |
| `src/locales/fr.json`             | Libellés                     |

## 4. Critères d'acceptation

1. Dans la liste des simulations, un bouton « Dupliquer » est disponible sur
   chaque simulation.
2. Au clic, un modal s'ouvre avec un champ « Nom de la copie » (pré-rempli).
3. Après validation, une nouvelle simulation apparaît dans la liste, avec les
   mêmes données (farm, barn, herd, report) mais un nom différent.
4. La simulation d'origine n'est pas modifiée.

## 5. Estimation

| Bloc                                 | Effort   |
| ------------------------------------ | -------- |
| Action `duplicateSimulation` (store) | ~0,3 j   |
| UI (bouton + modal)                  | ~0,5 j   |
| i18n                                 | ~0,2 j   |
| **Total**                            | **~1 j** |

---

## 6. Implémentation (2026-11-25)

### 6.1 Fichiers modifiés

| Fichier                                                          | Changement                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/store/modules/workspace.js`                                 | **nouvelle mutation** `duplicateSimulation(state, { simulation, name })` : copie **profonde** de la simulation (`deepCopy`), nom de la copie fourni, `loaded = false`, `lastModifiedDate` = aujourd'hui, push dans `workspace.simulations`. La source est conservée telle quelle (aucune mutation). |
| `src/views/workspace/SimulationDuplicateModal.vue` (**nouveau**) | Modal de duplication (pattern `SimulationModal.vue`) : champ « Nom de la copie » pré-rempli avec `« Nom original » (copie) »`, règle `required`, émet `add-item` avec `{ item: source, name }`.                                                                                                     |
| `src/views/workspace/Content.vue`                                | Icône `mdi-content-copy` (grise) dans la colonne Actions de la datatable des simulations (entre edit et delete) ; data `duplicateItemSource` + `dialogs.duplicateSimulation` ; méthodes `duplicateItem` (ouvre le modal) et `duplicateSimulation` (commit de la mutation).                          |
| `src/locales/fr.json`                                            | Clés `workspace.content.datatables.simulation.duplicate.dialog.*` (titre, libellé du nom, succès/erreur).                                                                                                                                                                                           |
| `tests/unit/vuex/duplicateSimulation.spec.js` (**nouveau**)      | 4 tests verts (mutation isolée, `@/store` mocké car le module workspace importe mapper → calculations → index du store).                                                                                                                                                                            |

### 6.2 Choix d'implémentation

- **Mutation** (pas d'action) : la duplication est un opérateur **local au workspace** (pas de dispatch d'actions simulateur), donc la mutation est suffisante — même pattern que `addSimulation` / `deleteSimulation`.
- **`loaded = false`** sur la copie : la simulation d'origine peut être chargée dans le simulateur ; la copie ne doit pas la « voler » (un seul `loaded === true` à la fois, cf. `activateSimulation`).
- **Copie profonde** : `farm`, `barn`, `herd`, `report` sont dupliqués — muter la copie ne touche jamais la source (verrouillé par test).
- **Pas de `id`** : les simulations du workspace sont référencées par objet (deepEqual / indexOf), pas par id — cohérent avec l'architecture verrouillée (ticket 1 §2.4).
