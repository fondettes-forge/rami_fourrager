# Backlog — Rami liste

> Travaux identifiés mais **non traités** (hors périmètre des tickets ou en attente
> d'une décision). Mis à jour à chaque traitement.
> Index général des tickets : [INDEX.md](INDEX.md).

---

## BL-1 — Ticket 3 §2.2 : Céréales / protéagineux en tonnes

> Source : [ticket-3
> ](ticket-3-paille-cereales-tonnes.md) §2.2 (demande du mail :
> « les céréales peuvent aussi être mis en tonne »).
> Ajouté au backlog : 2026-11-17 (décision utilisateur : le laisser en backlog).
> Statut : **⏳ à valider + à implémenter** · Type : correction · Effort : ~1 j

**Nature** : conversion d'unité à 360° — `RC`/`RP` passent de `qtx` à `t` partout.

**Périmètre** (détail dans la doc §2.2) :

1. `store/modules/referential.js` — `barnStockItems` : `RC`/`RP` `unity: 'qtx'` → `'t'` ;
   `farming_methods` : `'qtx/ha'` → `'t/ha'`.
2. `store/modules/mixins.js` :
   - `getConsumptionForConcentrated` (L580) : `consumption / 100` → `/ 1000`
     (kg → t au lieu de kg → qtx) ;
   - `dispatchProductionByPeriod` (L1342+) : la production grain est en `qtx/ha`
     (donnée STIC) → convertir en `t/ha` (`/ 10`) pour RC/RP.
3. `locales/fr.json` : `barn.concentrated.energeticQuantity` / `proteicQuantity`
   (« en qtx » → « en tonnes »), `report…grainHarvest` (« qtx/ha » → « t/ha »).
4. **Migration des valeurs déjà saisies** (workspaces + fixture de tests) :
   - workspace actuel : `RC: 216 qtx → 21,6 t`, `RP: -96 qtx → -9,6 t` ;
   - production P8 `stockByPeriod` : `450 qtx → 45 t` ;
   - fixture `tests/unit/vuex/fixtures/rootState.json` : mêmes valeurs à convertir
     (les specs `report`/`herd` sont calées dessus — vérifier les attentes en qtx).
   - Stratégie à choisir : migration à la charge type ticket 3 §2.1
     (heuristique `> 100` ⇒ `/10` ?) **ou** conversion manuelle des valeurs.
     ⚠️ L'heuristique est moins sûre que pour la paille (un stock de 200 qtx = 20 t
     est plausible ; seuil ambigü) — plutôt conversion explicite ou libellé
     d'accompagnement.
5. Tests : `straw.spec.js` ou nouveau `cereales.spec.js` — lot distribuant RC →
   `getConsumptionForConcentrated` renvoie en t (facteur `/1000`) ; production
   `t/ha`.

**Point de vigilance** : la consommation concentrée est saisie dans le lot en
**kg brut/animal/j** — cette saisie brute **ne change pas** ; seule la remontée vers
les stocks change d'unité. À documenter dans l'UI pour éviter la confusion.

**Prérequis / liens** :

- indépendant du ticket 3 §2.1 (paille, ✅ fait) ;
- lié au ticket 12 (tourteaux, `Stock_correspondant`) : si l'Option 2 (`RT`) est
  retenue, la nouvelle ligne RT aura la même question d'unité — trancher ensemble.
