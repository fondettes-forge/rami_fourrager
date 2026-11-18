# Ticket 7 — Nouvelle baguette : décliner entre années climatiques

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §7.
> Statut : **à traiter** · Priorité : **moyenne** · Type : nouveauté
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Il n'est pas possible de décliner une baguette d'une année climatique à une
> autre. Peut-être juste mettre une liste « normal/sec » pour ré-attribuer
> l'année climatique. Comme sur la gauche, il y a « Choisir le type de pâture ».

### 1.2 État actuel du modal baguette (`views/workspace/SticModal.vue`)

Le modal a déjà un **bloc « copier »** (L35-86) :

- un `v-select` **site** (`siteList`) → `handleSiteChange` (L346) ;
- un `v-select` **année climatique** (`climaticYears`, filtrés par site) →
  `handleCYchange` (L349) qui met à jour `stic.climatic_year_id` et `sticList` ;
- un `v-autocomplete` **baguette à copier** (`sticToCopy`) ;
- un bouton **Copier** → `copyStic()` (L353) : `this.stic = deepCopy(this.sticToCopy)`.

➡️ **Le mécanisme de copier existe déjà** : on peut copier une baguette d'une
année climatique vers une autre (on change le select année climatique, puis on
clique Copier). **Mais** :

1. `copyStic()` copie la baguette **sans changer** son `climatic_year_id` de
   destination — en fait le `climaticYear` setter (L334-338) met à jour
   `this.stic.climatic_year_id`, mais `copyStic()` fait un `deepCopy` **par-dessus**
   → l'`id` d'origine est recopié. À la sauvegarde (`saveItem` L365),
   `if (this.stic.id) delete this.stic.id` (L367) supprime l'`id` mais
   **`climatic_year_id` reste celui de la source** (pas celui du select
   destination). ➡️ **Bug latent** : la copie garde l'année climatique de
   **source**, pas de destination.

2. Le bloc « copier » est **`disabled` en mode édition** (`copyDisabled` L254) :
   on ne peut décliner une baguette **existante** (du workspace) que depuis la
   **création**. Pour « décliner une baguette d'une année à l'autre »,
   l'utilisateur doit passer par la création.

### 1.3 Le « normal / sec »

La demande veut une **liste « normal / sec »** (ou plutôt : la liste des années
climatiques du site, filtrées) pour **ré-attribuer** l'année climatique, sur le
principe du sélecteur « Choisir le type de pâture » (L96-105).

Or le sélecteur **année climatique** existe déjà (L49-59) — filtré par site.
La demande est donc :

- **fiabiliser** le mécanisme de copie (bug latent 1.2.1 : la destination doit
  être l'année climatique **du select**, pas celle de la source) ;
- **rendre le déclinaison évidente** : un sélecteur clair « Année climatique de
  destination » (liste des années du site, ex. « normale » / « sèche »), qui
  sert à la fois de source (pour choisir la baguette à copier) **et** de
  destination.

### 1.4 Résumé

| # | Cause | Où | Impact |
|---|-------|----|--------|
| B1 | `copyStic()` recopie `climatic_year_id` de la source au lieu de prendre celui du select destination | `SticModal.vue` L353, L334-338 | la baguette copiée reste sur l'année climatique de **source** |
| B2 | le bloc copier est `disabled` en mode édition ; le déclinaison doit passer par la création | `SticModal.vue` L254 | peu évident pour l'utilisateur |
| B3 | pas de sélecteur explicite « année climatique de destination » (le select existant sert à la fois source et destination) | `SticModal.vue` L49-59 | confusion source/destination |

---

## 2. Recommandations (plan de correction)

### 2.1 Corriger la copie pour prendre l'année climatique de destination (B1)

Dans `copyStic()` (L353), après le `deepCopy`, **forcer**
`this.stic.climatic_year_id` sur l'année climatique **du select**
(`this.climaticYear`) :

```js
copyStic() {
  const sourceClimaticYear = this.sticToCopy.climatic_year_id
  this.stic = deepCopy(this.sticToCopy)
  // destination = année climatique sélectionnée (pas celle de la source)
  const target = this.getClimaticYearById(this.climaticYear)
  if (target) {
    this.stic.climatic_year_id = target.id
    // le site suit l'année climatique de destination
  }
}
```

➡️ À valider : le `site` d'une baguette est dérivé de son
`climatic_year_id` (relation backend `Stic → ClimaticYear → Site`). Si la
destination a un **autre site**, la baguette changera de site — c'est le
comportement attendu (« d'un site sur l'autre », cf. TODO L234).

### 2.2 Clarifier l'UX source / destination (B3)

Option A (minimal) : renommer les libellés du bloc copier :

- `stic_to_copy` → **« Baguette source (à copier) »** ;
- ajouter sous le select année climatique le libellé
  **« Année climatique de destination »**.

Option B (UX plus nette) : un sous-état « **Décliner vers…** » avec un
sélecteur dédié destination, distinct du sélecteur source. Plus de code.

➡️ **Préco** : Option A (renommage + fix B1), le mécanisme est déjà là.

### 2.3 Déclinaison d'une baguette existante (B2) — option

Aujourd'hui le bloc copier est `disabled` en édition. Pour « décliner une
baguette existante du workspace vers une autre année », il faudrait autoriser la
copie depuis l'édition (ou un bouton « Dupliquer vers… » dans le datatable
`stic` de `Content.vue`). C'est plus de code (à rapprocher du **ticket 5** —
même pattern de dupliquer).

➡️ **Option** : si la demande est surtout « décliner **d'une année à l'autre** »,
le 2.1+2.2 suffisent (la baguette est déclinée via la création). Si la demande
est « décliner **la baguette que j'ai déjà** », il faut le 2.3. **À clarifier
avec Antoine.**

---

## 3. Fichiers impactés (récap)

| Fichier | Changement |
|---------|-----------|
| `src/views/workspace/SticModal.vue` (`copyStic`, L353) | prendre `climatic_year_id` de destination (B1) |
| `src/locales/fr.json` | libellés source/destination (B3) |
| `src/views/workspace/SticModal.vue` (+ `Content.vue`) | (option 2.3) déclinaison depuis l'édition |

---

## 4. Critères d'acceptation

1. Je crée une baguette sur l'année climatique « normale » (site X).
2. Je la décline vers l'année climatique « sèche » (site X) : le modal me
   propose la baguette source, je choisis l'année « sèche » comme destination,
   je clique Copier → la baguette est pré-remplie **avec `climatic_year_id` de
   la destination**.
3. Enregistrer crée la baguette **sur l'année climatique de destination**
   (vérifiable dans le datatable `stic` du workspace).
4. (Option 2.3) je peux décliner une baguette **existante** du workspace.

## 5. Risques / points d'attention

- **Changement de site** : si destination = autre site, la baguette change de
  site (comportement attendu, mais à documenter).
- **`getSticByName`** : les getters `sticList`/`getSticByName` filtrent par
  `climatic_year_id` — une baguette copiée sur une autre année sera bien
  résolue si elle est bien dans `workspace.stics` (fusion `mergeLists`, ticket 1).
- **TODO L234** : le commentaire « permettre la copie de baguette d'une année
  climatique et d'un site sur l'autre » décrit exactement ce ticket — le fix
  B1 en est le cœur.

## 6. Estimation

| Bloc | Effort |
|------|--------|
| Fix B1 (climatic_year_id destination) | ~0,25 j |
| B3 (libellés source/destination) | ~0,25 j |
| (Option 2.3) déclinaison depuis l'édition | ~0,5 j |
| Tests / validation | ~0,25 j |
| **Total** | **~0,75 j** (sans 2.3) / **~1,25 j** (avec 2.3) |
