# Ticket 1 — Carte ration ajoutée introuvable (Troupeau\lot et Grange)

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §1 (doublon §6).
> Statut : **à traiter** · Priorité : **haute** · Type : bug
> Date de l'analyse : 2026-11-16

---

## 1. Analyse du bug

### 1.1 Ce que fait déjà l'app

La création de cartes rations existe dans _Mes configurations → Mes cartes rations_
(`workspace/Content.vue`, tab `feed` + modal `workspace/ClassicFeedModal.vue`) :

- la carte créée (nom, `correspondingStock`, 9 valeurs nutritionnelles) est poussée dans
  `workspace.classicFeeds` (mutation générique `workspace/addItem`, cf.
  `saveItem` de `views/workspace/Content.vue` L480) puis persistée dans le `workspace.json`
  (`"classicFeeds": [...]`, cf. `workspace/workspace.json` L3257).

### 1.2 Pourquoi la carte ne ressort pas dans **Troupeau → lot → Aliments**

La liste du select « Ajouter un aliment » est fournie par le getter
`classicFeedList` de `services/frontend/ui/src/store/modules/referential.js` (L173) :

```js
classicFeedList: (state, getters, rootState) => {
  var list = state.feed_types;
  if (rootState.workspace.workspace.classicFeeds?.length > 0) {
    list = mergeLists(
      [...state.feed_types],
      [...rootState.workspace.workspace.classicFeeds],
    );
  }
  return list;
};
```

et la fusion `mergeLists` (L27) **n'ajoute les cartes personnalisées que si la liste
référentielle est non vide** :

```js
function mergeLists(dbList, customList) {
  const lastItem = dbList[dbList.length - 1]
  if (Object.prototype.hasOwnProperty.call(lastItem, 'id')) {   // ← dbList vide ⇒ lastItem === undefined ⇒ TypeError
    ...
  }
  return dbList
}
```

**Causes racine (Troupeau)** :

1. **`mergeLists` casse avec une liste référentielle vide** : pas de `feed_types` en
   base (pas de migration/seeding, API down…) ⇒ `lastItem` est `undefined`,
   `hasOwnProperty.call(undefined, ...)` lève une `TypeError`, le getter s'écrase
   et le select affiche une liste vide/erreur.
2. **Même si `feed_types` est peuplée, la référence d'API peut ne pas avoir été
   rafraîchie** : le referential est synchronisé de façon incrémentale
   (`fetch(what, since...)` avec `lastConnectionDate`) ; si l'API ne renvoie pas de
   delta pour `feed_type` (ou si le premier chargement a échoué silencieusement),
   `state.feed_types` reste `[]` et on retombe sur le point 1.
3. **Pas de garde côté UI** : `ClassicFeedModal` (herd) ne gère pas l'état « liste
   vide » ni l'erreur du getter, donc l'utilisateur ne voit que « seule la liste des
   aliments référentiels est proposée » (ou rien).

> Le getter `concentratedFeedList` (L165) a **un bug différent, plus grave** : il
> fusionne `state.feed_types` avec `workspace.concentratedFeeds` au lieu de
> `state.concentrated_feeds` :
>
> ```js
> list = mergeLists(
>   [...state.feed_types],
>   [...rootState.workspace.workspace.concentratedFeeds],
> );
> ```
>
> à corriger dans la même passe (même famille de bug).

### 1.3 Pourquoi la carte ne ressort pas dans la **Grange**

La Grange a **deux surfaces d'impact distinctes** :

1. **Modal « Ajouter un stock » / liste des types de stock**
   (`views/simulator/Barn.vue`, v-select `:items="barnStockItems"` L120) : il
   s'agit des **8 codes de stock référentiels** (`FH`, `EH`, `EM`, `RC`, `RP`, `AS`,
   `EL`, `FL`) — liste statique en dur dans `referential.js` L42-52.
   Une carte ration n'est **pas** un type de stock : c'est un aliment qui **pointe
   vers** un type de stock via `correspondingStock`. Elle n'a donc pas vocation à
   apparaître dans _ce_ select.

   ➡️ **Point de clarification à valider avec INRAE (Antoine)** : la demande
   « la carte doit apparaître dans la liste des stocks de la Grange » doit être
   comprise au sens : *le stock visé par la carte doit être _*consommé/comptabilisé*
   dans les stocks de la Grange (STOCKS ET COUTS)_, et non littéralement _la carte
   comme nouvelle ligne de stock_. L'interprétation retenue ici est la 2e :
   **les aliments issus de cartes custom doivent participer au calcul des
   consommations par code de stock** (`getConsumptionByBarnStockItem`, `mixins.js`
   L595), qui fonctionne déjà par **comparaison de `correspondingStock`**
   (`getBatchConsumption` L665 : `curr.type.correspondingStock === stockCode`) —
   donc le calcul est agnostique de l'origine de l'aliment, à condition que la carte
   soit bien dans la liste (retour au point 1.2).

2. **STOCKS ET COUTS** (report) : même constat — la consommation d'une carte custom
   remonte vers le code de stock cible uniquement si la carte est distribuée (via le
   Troupeau, donc via le getter `classicFeedList` cassé).

### 1.4 Résumé des causes racines

| #   | Cause                                                                                                  | Où                                     | Impact                                                 |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------ |
| C1  | `mergeLists` lève `TypeError` si la liste référentielle est vide (pas de garde)                        | `store/modules/referential.js` L27-37  | carte custom jamais proposée (Troupeau)                |
| C2  | dépendance au delta API `lastConnectionDate` sans fallback robuste (état vide persistant)              | `store/modules/referential.js` L6-19   | `feed_types` peut rester `[]`                          |
| C3  | typo dans `concentratedFeedList` : fusion sur `state.feed_types` au lieu de `state.concentrated_feeds` | `store/modules/referential.js` L168    | concentrés custom jamais proposés + doublons possibles |
| C4  | pas de validation que `correspondingStock` existe dans `barnStockItems` à la création                  | `views/workspace/ClassicFeedModal.vue` | carte qui ne peut jamais être consommée (silencieuse)  |
| C5  | aucune couverture de test sur `mergeLists` / getters de fusion                                         | `tests/unit/vuex/`                     | le bug est passé inaperçu                              |

---

## 2. Recommandations (plan de correction)

### 2.1 Fixes frontend — store (cœur du bug) — **à faire en premier**

Fichier : `services/frontend/ui/src/store/modules/referential.js`

1. **Rendre `mergeLists` robuste** (liste vide, doublons d'`id`) :

   ```js
   function mergeLists(dbList, customList) {
     if (!dbList.length) {
       // pas d'ancrage d'id référentiel : on attribue des ids négatifs
       // (ids référentiels >= 1 ; ids custom < 0 pour éviter les collisions
       //  et rester identifiables côté persistance)
       return customList.map((cl, index) => ({ id: -(index + 1), ...deepCopy(cl) }))
     }
     const lastId = Math.max(...dbList.map((el) => el.id || 0))
     return [...dbList, ...customList.map((cl, index) => ({ id: lastId + index + 1, ...deepCopy(cl) }))
   }
   ```

   (variante actuelle `lastItem.id + index + 1` → `Math.max` pour résister aux ids
   non consécutifs ; les ids custom restent des **aliases dérivés à la volée** —
   voir 2.4 sur la pérennité des ids custom.)

2. **Corriger `concentratedFeedList`** (C3) :

   ```js
   list = mergeLists(
     [...state.concentrated_feeds],
     [...rootState.workspace.workspace.concentratedFeeds],
   );
   ```

3. **Ne plus filtrer les cartes custom sur la présence de `feed_types`** : le `if
(rootState.workspace.workspace.classicFeeds?.length > 0)` doit rester, mais le
   `mergeLists` corrigé rend le résultat toujours correct.

### 2.2 Fixes frontend — UI

1. **`views/workspace/ClassicFeedModal.vue`** (création de la carte) :
   - ajouter une **règle de validation** : `correspondingStock` doit appartenir aux
     codes de `barnStockItems` (C4) ;
   - afficher le nom du stock correspondant (pas le code brut) dans le libellé du
     select — déjà OK via `item-text="name"`, conserver ;
   - prévoir un état vide explicite dans le select (`no-data-text`).

2. **`components/parts/herd/ClassicFeedModal.vue`** (Troupeau → lot) :
   - `no-data-text` sur le v-select « type d'aliment » : « Aucun aliment
     référentiel disponible — vérifiez votre connexion à l'API / vos
     configurations » ;
   - option (pistes 2.3) : un **groupe visuel** dans le select
     (`v-select` avec `group` ou deux listes séparées) distinguant
     _Référentiels_ / _Mes cartes rations_ — améliore directement la
     compréhension demandée par Antoine.

3. **`views/simulator/Barn.vue`** (Grange) :
   - pas de changement du select « type de stock » (une carte n'est pas un type de
     stock) ;
   - **vérifier** que le calcul de consommation par code de stock intègre bien les
     cartes custom (reprise 2.3) ; si besoin, ajouter un tooltip/lien
     « les cartes rations associées à ce stock » au-dessus de la table des stocks.

### 2.3 Vérification des impacts en aval (à valider par des tests)

La chaîne en aval est déjà **agnostique de l'origine de l'aliment** (elle lit
`type.correspondingStock`), il faut juste la couvrir :

- `mixins.js` `getBatchConsumption` (L665), `getBatchConcentratedConsumption`,
  `getDryMatterProvided` (L1249) ;
- getters `report.js` : `getClassicFeedsStock`, `getConcentratedFeedsStock`
  (consommation par code) ;
- **attention à `report.js` L323** : commentaire `// s'il y a de la paille
alimentaire, on ajoute la paille ?!` et liste
  `stockCodeList = ['FH','EH','EM','EL','FL','AS']` (sans `STRAW`) dans
  `getStockEvolution` — **c'est le bug des tickets 2/8** (paille non comptée dans
  la Grange/STOCKS ET COUTS) ; corriger **de concert** (voir
  [ticket-2](ticket-2-paille-stocks-couts.md) / [ticket-8](ticket-8-paille-aucune-conso.md)
  à créer) : inclure `STRAW` + distinguer paille alimentation / paille logement.

### 2.4 Position d'architecture (verrouillée)

**La carte ration custom vit dans le workspace local** (`workspace.classicFeeds`,
persistée dans `workspace.json`) — **pas de backend, pas d'endpoint dédié, pas de
migration**.

L'application est quasi stateless côté serveur : le workspace local + le fichier de
sauvegarde du workspace sont des **choix architecturaux fondamentaux** du Rami.
Corriger le bug revient donc à **rendre la fusion locale robuste** (2.1), sans
changer le périmètre de stockage. Si un jour les utilisateurs doivent retrouver
leurs cartes dans d'autres workspaces, on traitera la demande comme une nouveauté
séparée (hors périmètre de ce ticket).

> Conséquence directe : les ids des cartes custom ne sont pas stables — ils sont
> dérivés à la volée par `mergeLists` (ids référentiels + offset, ou ids négatifs
> si la liste référentielle est vide). Les références aux cartes custom dans le
> workspace sont donc **par référence objet (deepEqual)**, comme c'est déjà le cas
> pour `workspace.classicFeeds` (mutations `addClassicFeed` / `updateClassicFeed` /
> `deleteClassicFeed` dans `workspace.js`), et **jamais par id**.

### 2.5 Tests à ajouter (`tests/unit/vuex/`)

- `referential.spec.js` (nouveau) :
  - `classicFeedList` avec `feed_types` vide + 1 carte custom ⇒ renvoie la carte
    (id négatif, sans `TypeError`) ;
  - `classicFeedList` avec `feed_types` peuplée + cartes custom ⇒ liste concaténée
    sans doublon d'`id` ;
  - `concentratedFeedList` : même scénario (verrouille le fix C3) ;
  - `mergeLists` : liste vide, liste non vide, ids non consécutifs.
- Test de calcul : simulation avec 1 lot utilisant une **carte custom**
  (`correspondingStock: 'FH'`) ⇒ `getClassicFeedsStock` retourne une consommation
  `FH` non nulle (garde-fou anti-régression du ticket 1 côté Grange/STOCKS).

---

## 3. Fichiers impactés (récap)

| Fichier                                                               | Changement                                                                                      |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `services/frontend/ui/src/store/modules/referential.js`               | fix `mergeLists`, fix `concentratedFeedList` (C1, C2, C3)                                       |
| `services/frontend/ui/src/views/workspace/ClassicFeedModal.vue`       | validation `correspondingStock` (C4)                                                            |
| `services/frontend/ui/src/components/parts/herd/ClassicFeedModal.vue` | état vide + (opt.) groupes référentiel/custom                                                   |
| `services/frontend/ui/src/views/simulator/Barn.vue`                   | pas de changement du select ; vérif/tooltip éventuel                                            |
| `services/frontend/ui/src/store/modules/report.js` (L323)             | ⚠️ en lien tickets 2/8 : ajouter `STRAW` à `getStockEvolution` (ne pas mélanger dans ce ticket) |
| `tests/unit/vuex/referential.spec.js` (nouveau)                       | tests de fusion + test de consommation carte custom                                             |

---

## 4. Critères d'acceptation (définition de fait)

1. Je crée « Foin Luzerne Brenne » (FH) dans _Mes configurations → Mes cartes rations_.
2. Dans _Troupeau → lot → Ajouter un aliment_, la carte apparaît **même si la liste
   référentielle est vide** (mode offline / pas de seed) — plus de `TypeError`.
3. Je la distribue à un lot sur une période ; dans _Bilan → Stocks et coûts_, la
   consommation du code `FH` reflète la distribution (et la Grange en tient compte).
4. Les cartes _concentrées_ custom (ex. tourteaux) apparaissent aussi dans le select
   concentrés (fix C3) — et remontent dans STOCKS ET COUTS **si** `stock_correspondant`
   est renseigné (sinon : ticket 12, à traiter séparément).
5. Les tests unitaires de fusion passent en local (`npm run test:unit`).

## 5. Risques / points d'attention

- **Compatibilité workspace existants** : les `classicFeeds` déjà créées n'ont pas
  d'`id` ; la fusion doit continuer de leur attribuer des ids à la volée (déjà le
  cas). Aucun changement de format `workspace.json` requis.
- **Collision d'ids** si l'utilisateur crée plus de cartes qu'il n'y a de
  référentiels : l'`Math.max` + offset (2.1) l'évite côté store. Comme les ids
  custom sont dérivés à la volée (2.4), le point de vigilance réel est que le
  code en aval **ne référence jamais une carte custom par son id** — toujours par
  objet (deepEqual) ou par `correspondingStock`.
- **Ne pas mélanger avec les tickets 2/8** (paille) : la ligne paille de
  `getStockEvolution` est un bug distinct déjà identifié ; la corriger dans ce
  ticket rendrait le diff plus dur à revisiter.

## 6. Estimation

| Bloc                                                               | Effort                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Fixes store (`referential.js`) + tests unitaires                   | ~0,5 j                                                                      |
| Fixes UI (validations, états vides, groupes optionnels)            | ~0,5 j                                                                      |
| Vérification en aval + tests de calcul (consommation carte custom) | ~0,5 j                                                                      |
| **Total**                                                          | **~1,5 j** (hors ticket 12 sur les tourteaux et tickets 2/8 sur la paille ; |
| architecture verrouillée sur le workspace local — 2.4)             |
