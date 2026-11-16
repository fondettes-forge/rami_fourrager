# Ticket 5 — Mes cartes rations : dupliquer / adapter une carte existante

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §5.
> Statut : **à traiter** · Priorité : **moyenne** · Type : nouveauté
> Seche lié : ticket **1** (la carte dupliquée doit être distribuable — déjà corrigé)
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Besoin : adaptation d'un foin existant pour créer une version adaptée à un cas
> concret. Il n'est pas possible de créer une nouvelle carte ration à partir d'une
> existante.

### 1.2 État actuel

Le formulaire de création (`views/workspace/ClassicFeedModal.vue`) part **à zéro** :
le `watch` sur `item` (L121-145) initialise `feedItem` avec un nom vide et les 9
valeurs nutritionnelles à **0** quand `item` est `null` (mode création).

Le datatable « Mes cartes rations » (`Content.vue` L238-280) propose déjà
**deux actions par ligne** :

- **Supprimer** (`deleteItem('classicFeed', item)`) ;
- **Modifier** (`editItem('classicFeed', item)`) — qui ouvre le **même modal**
  en mode édition (`newItems.classicFeed = deepCopy(item)`, L500-504).

➡️ Le mode **édition** existe déjà (le modal pré-remplit le formulaire avec
`item` via le `watch`). Le **dupliquer** manque : il s'agit d'ouvrir le modal en
**mode création** mais **pré-rempli** avec les valeurs d'une carte existante,
avec un **nouveau nom** (le nom d'origine est modifié).

### 1.3 Point de vigilance : les ids custom (ticket 1 §2.4)

Les cartes custom n'ont **pas d'`id` stable** — l'`id` est dérivé à la volée par
`mergeLists` (`referential.js` L27). La dupplication ne doit donc **jamais**
copier un `id` : on copie **les valeurs** (`name`, `correspondingStock`,
`nutritional_values`) et on **vide le nom** (ou on le préfixe) pour que
l'utilisateur le renomme. L'`id` sera recalculé à la volée comme pour toute
carte custom.

---

## 2. Recommandations (plan de correction)

### 2.1 Ajouter une action « Dupliquer » dans le datatable

**Fichier** : `views/workspace/Content.vue` (tab `feed`, L263-278)

Ajouter une **troisième icône** (ex. `mdi-content-copy`) entre modifier et
supprimer, qui :

1. clone la carte : `this.oldItems.classicFeed = null` (→ mode **création**) ;
2. pré-remplit : `this.newItems.classicFeed = deepCopy(item)` ;
3. **force le nom** à un nom par défaut dérivé, ex. `item.name + ' (copie)'`
   (l'utilisateur le renomme) ;
4. ouvre le modal : `this.dialogs.classicFeed = true`.

➡️ Comme le `watch` de `ClassicFeedModal.vue` (L121) pré-remplit `feedItem` avec
`item` quand il est non-null, le formulaire s'ouvrira **pré-rempli** (nom,
stock correspondant, 9 valeurs nutritionnelles). L'utilisateur change le nom et
valide → `saveItem` émet `add-item` → `Content.vue` `saveItem` (L480) fait un
`workspace/addItem` (ajout, car `oldItems.classicFeed === null`).

### 2.2 Variante (option) : bouton « Créer à partir de… » dans le modal

Une alternative UX : un **select « dupliquer depuis »** en haut du modal de
création, listant les cartes existantes (getters `workspace` `classicFeeds`).
Au choix d'une carte, le formulaire se pré-remplit. C'est plus de code (un
select + une logique de pré-remplissage) mais plus évident pour l'utilisateur.

➡️ **Préco** : la **2.1 (icône copier)** est la plus simple et cohérente avec
les actions existantes (supprimer/modifier). La 2.2 en option si l'UX 2.1 est
jugée insuffisante.

### 2.3 Validation du nom

Ajouter une règle (ou à la sauvegarde) : le nom de la carte dupliquée doit être
**différent** des noms existants (sinon, deux cartes identiques). Ce n'est pas
bloquant (les cartes sont identifiées par objet, pas par nom), mais évite la
confusion. À valider avec l'UX.

---

## 3. Fichiers impactés (récap)

| Fichier | Changement |
|---------|-----------|
| `src/views/workspace/Content.vue` (tab `feed`) | icône « dupliquer » + logique de pré-remplissage (2.1) |
| `src/locales/fr.json` | libellé bouton/tooltip dupliquer (si besoin) |
| `src/views/workspace/ClassicFeedModal.vue` | (option 2.2) select « dupliquer depuis » |

---

## 4. Critères d'acceptation

1. Dans *Mes configurations → Mes cartes rations*, chaque ligne a une action
   **Dupliquer**.
2. Cliquer sur Dupliquer ouvre le modal **pré-rempli** (nom, stock, 9 valeurs)
   avec un **nom dérivé** (ex. « Foin Luzerne Brenne (copie) »).
3. Valider crée une **nouvelle** carte (la source est inchangée) ; la nouvelle
   carte est **distribuée** (ticket 1) et **remonte** dans STOCKS ET COUTS.
4. La carte dupliquée n'a **pas** l'`id` de la source (id dérivé à la volée).

## 5. Risques / points d'attention

- **Ne pas copier l'`id`** (2.3) : les ids custom sont des aliases dérivés ;
  copier un id créerait un doublon d'id dans `mergeLists`.
- **Nom identique** : deux cartes au même nom sont possibles (identifiées par
  objet) — à documenter ou à bloquer (2.3).
- **Couplage ticket 1** : sans le fix du ticket 1, la carte dupliquée ne serait
  pas distribuable. Le ticket 1 est déjà implémenté.

## 6. Estimation

| Bloc | Effort |
|------|--------|
| Icône dupliquer + pré-remplissage (2.1) | ~0,25 j |
| (Option 2.2) select « dupliquer depuis » | ~0,25 j |
| Tests / validation | ~0,25 j |
| **Total** | **~0,5 j** |
