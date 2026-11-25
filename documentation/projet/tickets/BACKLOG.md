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

---

## BL-2 — Ticket 24 §2.2 : Suppression des éléments du référentiel

> Source : [ticket-24](ticket-24-metadata-referentiel.md) §2.2.
> Ajouté au backlog : 2026-11-23 (décision utilisateur : retirer la suppression
> du périmètre du ticket 24 → devis 05D passé de 16 h à 8 h).
> Statut : **⏳ à traiter** · Type : nouvelle fonctionnalité · Effort : ~1 j

**Périmètre** (détail dans la doc ticket 24 §2.2) :

1. **Backend** :
   - Endpoints `DELETE` pour les modèles du référentiel (Stic, Site,
     ClimaticYear, FeedType, etc.).
   - Contraintes de suppression : ne pas supprimer un élément utilisé par une
     simulation (ou « suppression douce » / soft delete).
2. **Frontend** :
   - Bouton « Supprimer » dans les UI de gestion (intégrer dans
     `SiteManager.vue` si le ticket 20 est fait).
   - Modal de confirmation (« Êtes-vous sûr ? »).

**Lien** : dépend du ticket 20 (gestion des sites) pour la partie UI — à
trancher ensemble.

---

## BL-3 — Ticket 25 : Page des partenaires — mode pop-up logos

> Source : [ticket-25](ticket-25-page-partenaires.md) (devis 2025 `05D`,
> [devis 2026 `#2026111904D`](../devis_en_attente/2026111904D_devis_Antoine_Savoie_inrae_evolution_partenaires_tickets.docx)).
> Ajouté au backlog : 2026-11-23 (décision utilisateur : ticket 25 entièrement
> au backlog).
> **2026-11-25** : confirmé au backlog — **partiellement traité** (la page
> existe déjà), à améliorer **uniquement si demandé**.
> Statut : **⏳ à traiter si demandé** · Type : correction / UX · Effort : ~0,5 j

**Nature** : `PartnersPage.vue` est **déjà implémentée** (page route, 12 logos
en 5 blocs, i18n `partners.*`). Il manque le **mode pop-up** : un déclencheur
discret (footer/menu, à valider) qui ouvre un `v-dialog` avec les logos, sans
quitter la page.

**Périmètre** (détail dans la doc ticket 25) :

1. Extraire le bloc logos dans `components/partners/PartnersLogos.vue` (partagé
   page/modal).
2. Créer `components/partners/PartnersModal.vue` (`v-dialog` large, scrollable).
3. Ajouter le déclencheur dans le layout principal (footer ou menu — **à
   trancher avec Antoine** ; accessible avant login ?).
4. Décider du sort de la route `PartnersPage` (garder si des liens externes
   pointent dessus).

**Points à trancher avant implémentation** :

- localisation du déclencheur (footer / menu / page login) ;
- conserver ou supprimer la route `PartnersPage`.
