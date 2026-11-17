# Ticket 3 — Paille (et céréales) en tonnes

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §3.
> Statut : **partiellement implémenté** (2.1 paille ✅ commité) · 2.2 céréales **à valider**
> Priorité : **moyenne** · Type : correction
> Seche liés : tickets **2** et **8** (paille — traités avant ce ticket)
> Date de l'analyse : 2026-11-16 · Implémentation 2.1 : 2026-11-17

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Si possible, mettre la paille en tonne (aussi dans La grange).
> (=> les céréales peuvent aussi être mis en tonne)

### 1.2 État actuel des unités

Les unités de stock sont définies **en dur** dans `barnStockItems`
(`store/modules/referential.js` L41-51) :

| Code      | Nom                             | `unity`                                         |
| --------- | ------------------------------- | ----------------------------------------------- |
| FH        | Foin                            | `tMS`                                           |
| EH        | Ensilage et enrubannage d'herbe | `tMS`                                           |
| EM        | Ensilage de maïs et sorgho      | `tMS`                                           |
| **RC**    | **Céréales en grain**           | **`qtx`**                                       |
| **RP**    | **Protéagineux en grain**       | **`qtx`**                                       |
| AS        | autre stock                     | `tMS`                                           |
| EL        | Ensilage de légumineuses        | `tMS`                                           |
| FL        | Foin de légumineuses            | `tMS`                                           |
| **STRAW** | **Paille**                      | **pas encore dans `barnStockItems`** (ticket 8) |

La paille, elle, est saisie **en kg** dans la Grange : le champ
« Stock de paille disponible au 1er janvier » est libellé
`barn.straw.quantity` = **« quantité (en kg) »** (`fr.json` L260) — or le
`strawQuantity` de `Barn.vue` (L248) écrit directement dans
`initialStocks[STRAW].quantity`, et tout le calcul paille
(`getFinalStockByBarnStockItem` L620 : `totalStrawStockProducted − conso`,
`setTotalStrawStock` L1316 : `/1000`) travaille **en tonnes**.
➡️ **Incohérence existante** : la saisie Grange est en kg, le calcul en t.
Le stock initial paille est donc surestimé d'un facteur 1000 dans STOCKS ET COUTS
(c'est en partie l'origine du `-9977` de la capture image008).

### 1.3 Les céréales en `qtx` : ce que ça implique

`RC`/`RP` sont en `qtx` (quintaux) :

- **Saisie Grange** (`Barn.vue` L34-47) : les champs `energeticQuantity` /
  `proteicQuantity` sont libellés sans unité explicite — l'utilisateur saisit
  en **quintaux** (cohérent avec `unity: 'qtx'`).
- **Production** : `dispatchProductionByPeriod` (`mixins.js` L1330) produit en
  `qtx/ha` pour les récoltes grain (commentaire L1334 « pour recoltes grain :
  qtx/ha »).
- **Consommation** : `getConsumptionForConcentrated` (L575) — la quantité saisie
  dans le lot est une quantité **par animal/jour** (kg), multipliée par
  `DAYS_BY_PERIOD` puis **`/ 100`** (L585) pour passer de kg à **quintaux**.
  Le `/100` est donc le facteur kg→qtx, **intrinsèque à l'unité qtx**.
- **STOCKS ET COUTS** : la ligne RC/RP affiche en quintaux (cohérent entre
  production, conso, stock final).

➡️ Passer `RC`/`RP` en tonnes = changer l'unité d'affichage **et** le facteur de
conversion de la consommation (`/100` → `/1000`), **et** la production
(`qtx/ha` → `t/ha`, soit `/10`), **et** la saisie Grange (l'utilisateur saisirait
en t au lieu de qtx). C'est une conversion d'unité à 360°, pas un simple label.

### 1.4 Résumé des causes racines

| #   | Cause                                                                 | Où                                                                      | Impact                                            |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| U1  | Paille : saisie Grange en **kg**, calcul en **t** (pas de conversion) | `Barn.vue` L248-261, `fr.json` `barn.straw.quantity`                    | stock initial paille ×1000 faux dans STOCKS/COUTS |
| U2  | Céréales/protéagineux en `qtx` : unité non tonne partout              | `referential.js` L46-47, `mixins.js` L585 (`/100`), production `qtx/ha` | l'utilisateur demande des tonnes                  |

---

## 2. Recommandations (plan de correction)

### 2.1 Paille en tonnes — **simple, à faire** (corrige U1) ✅ **Implémenté (2026-11-17)**

1. **`fr.json`** : `barn.straw.quantity` : « quantité (en kg) » →
   **« quantité (en tonnes) »**.
2. **`Barn.vue`** : rien à changer côté calcul (le calcul est déjà en t) —
   c'est la **saisie** qui devient cohérente (l'utilisateur saisit désormais en t).
3. **Migration des workspaces existants** ⚠️ : les `initialStocks[STRAW].quantity`
   déjà sauvegardées sont **en kg**. Implémenté en **Option B** (migration à la
   charge), point d'entrée unique `simulator/barn/setBarn` (`store/modules/barn.js`) :
   si `quantity > 1000` ⇒ `/ 1000`. Justification du seuil : un stock de 10 000 t de
   paille est absurde ; 10 000 kg = 10 t est la valeur type du mail INRAE
   (capture image008). Les valeurs ≤ 1000 sont considérées déjà en t (inchangées).
4. **Vérifié** que `getStrawStock` (`report.js`) et `getStockEvolution` affichent
   bien en t (tout le calcul paille est en t).

**Tests** (`straw.spec.js` §U1) : `setBarn` convertit 10000 kg → 10 t ; laisse 5 t
inchangé ; ne touche pas RC/FH ; `getStrawStock.initialStock` remonte la valeur telle
quelle (pas de ×1000).

### 2.2 Céréales/protéagineux en tonnes — **option demandé, plus coûteux** (corrige U2) ⏳ **À valider**

À faire **seulement si validé** (l'option est demandée, pas imposée). **Laisser en
backlog** (décision du 2026-11-17) — voir [BACKLOG.md](BACKLOG.md) §BL-1.
Impact chiffré (2026-11-17) : workspace actuel `RC: 216 qtx → 21,6 t`, `RP: -96 qtx → -9,6 t`,
production P8 `450 qtx → 45 t` ; fixture de tests à re-convertir ; saisie Grange et
`stockByPeriod` régénérés au prochain `setBarn`. Conversion 360° — **décision attendue**.

1. **`referential.js`** : `RC`/`RP` : `unity: 'qtx'` → `unity: 't'`.
   Idem dans `farming_methods` (L62-63) : `qtx/ha` → `t/ha`.
2. **`mixins.js`** :
   - `getConsumptionForConcentrated` (L585) : `consumption / 100` →
     `consumption / 1000` (kg → t au lieu de kg → qtx).
   - `dispatchProductionByPeriod` (L1330+) : la production grain est en `qtx/ha`
     (donnée STIC) → convertir en `t/ha` (`/ 10`) pour RC/RP.
   - **Vérifier** `getSticProductionByBarnStockItem` et tout ce qui consomme la
     production RC/RP.
3. **`Barn.vue`** : la saisie Grange passe de qtx à t (le libellé `unity` est
   dynamique via `selectedItem?.unity` — OK). Mais les **valeurs déjà saisies**
   dans les workspaces sont en qtx → même problème de migration que 2.1.3
   (re-saisir, ou migration `/10`).
4. **STOCKS ET COUTS** : les lignes RC/RP s'affichent alors en t (cohérent).

⚠️ **Point de vigilance** : la consommation concentrée est saisie dans le lot
en **kg/animal/j** (ex. « Tourteau de colza » 0,35) — **cette saisie ne change
pas** (elle est en kg, c'est la donnée brute). Seule la **remontée vers les
stocks** change d'unité. À documenter pour éviter la confusion.

### 2.3 Tests à ajouter

- Test paille : stock initial paille saisi en t → `getStrawStock.initialStock`
  = valeur saisie (pas ×1000).
- Test (si 2.2) : lot distribuant RC → `getConsumptionForConcentrated` renvoie
  en t (vérifier le facteur `/1000`).

---

## 3. Fichiers impactés (récap)

| Fichier                                             | Changement                                      |
| --------------------------------------------------- | ----------------------------------------------- |
| `src/locales/fr.json` (`barn.straw.quantity`)       | ✅ kg → tonnes (2.1)                            |
| `src/store/modules/barn.js` (`setBarn`)             | ✅ migration kg→t du stock initial paille (2.1) |
| `src/views/simulator/Barn.vue`                      | (2.1) rien ; (2.2) libellés dynamiques OK       |
| `src/store/modules/referential.js` (L46-47, L62-63) | (2.2) `qtx` → `t` ⏳                            |
| `src/store/modules/mixins.js` (L585, L1330+)        | (2.2) `/100` → `/1000`, production `/10` ⏳     |
| `tests/unit/vuex/straw.spec.js` (bloc U1)           | ✅ tests d'unité paille (4 tests)               |

---

## 4. Critères d'acceptation

1. ✅ Le champ « Stock de paille » de la Grange est libellé **en tonnes** ; la valeur
   saisie remonte **telle quelle** dans STOCKS ET COUTS (pas de ×1000) ; les anciens
   stocks en kg (> 1000) sont convertis à la charge.
2. (Si 2.2 validé) les lignes « Céréales en grain » / « Protéagineux en grain »
   de STOCKS ET COUTS et de la Grange sont **en tonnes** ; production, conso et
   stock final sont cohérents entre eux.
3. ✅ Les tests d'unité passent (straw.spec.js §U1, 22/22 avec le bloc paille).

## 5. Risques / points d'attention

- **Workspaces existants** : les valeurs paille (kg) et céréales (qtx) déjà
  saisies sont dans l'ancienne unité. Re-saisie manuelle recommandée (pas de
  migration heuristique).
- **Ne pas mélanger avec le bloc paille (tickets 2/8)** : le fix U1 (kg→t) est
  indépendant, mais le code `STRAW` n'existe pas encore dans `barnStockItems`
  (ticket 8) — le libellé Grange existe déjà, donc le fix U1 est faisable
  immédiatement.
- **2.2 est une conversion d'unité à 360°** : toucher `qtx`→`t` impacte la
  production, la consommation et la saisie — à valider explicitement avant
  implémentation (l'option est demandée, pas imposée).

## 6. Estimation

| Bloc                                            | Effort                                                  |
| ----------------------------------------------- | ------------------------------------------------------- |
| Paille en tonnes (U1, libellé + vérif)          | ~0,25 j                                                 |
| Céréales/protéagineux en tonnes (U2, si validé) | ~1 j                                                    |
| Tests                                           | ~0,25 j                                                 |
| **Total**                                       | **~0,5 j** (paille seule) / **~1,25 j** (avec céréales) |
