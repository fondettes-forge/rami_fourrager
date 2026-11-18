# Ticket 2 — Paille non comptabilisée dans STOCKS et COUTS

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §2.
> Statut : **à traiter** · Priorité : **haute** · Type : bug
> Seche liée : ticket **8** (même bloc paille — **traiter de concert**) · ticket **3** (unités)
> Date de l'analyse : 2026-11-16

---

## 1. Analyse du bug

### 1.1 Ce que dit la demande

> La paille distribuée en alimentation n'est pas comptabilisée dans STOCKS et COUTS.
> On remarque que la paille des bâtiments (litière) n'est pas non plus consommée dans
> STOCKS et COUTS.

Captures :

- `image008.png` — tableau STOCKS ET COUTS, section « La paille » :
  `paille 10000 / 0 / 0 / 23 / -9977 / 9978` — consommation incohérente.
- `image009.png` — Excel de référence : production de paille selon les cultures
  (`Rdt paille (kg/ha)`) et besoins en paille selon type de logement (`kg/ugb/j`) ;
  la paille y est comptabilisée **en logement ET en alimentation**.
- `image011.png` — une baguette utilisée produit bien de la paille (dernière colonne).

### 1.2 Lien direct avec le ticket 8

**Ce ticket est la même famille de bug que le ticket 8** (aucune paille consommée).
Les causes racines sont communes et détaillées dans
[ticket-8-paille-aucune-conso.md](ticket-8-paille-aucune-conso.md) §1.5 :

| #   | Cause                                                                                                       | Impact sur le ticket 2                                                              |
| --- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P1  | Paille non distribuable (pas de code `STRAW` dans `barnStockItems`, pas de carte « Paille »)                | la paille **aliment** n'est jamais distribuée → conso aliment = 0 dans STOCKS/COUTS |
| P2  | Production paille faussée (`setTotalStrawStock` somme `stic.rendement × surface` sans filtrer `Rdt_paille`) | production = 10000 (incohérent) dans STOCKS/COUTS                                   |
| P3  | Conso logement mal dimensionnée (`straw_requirement × besoinMS` au lieu de `× nb_animaux × UGB × jours`)    | conso **logement** incohérente dans STOCKS/COUTS                                    |
| P4  | Stock final paille ignore le stock initial                                                                  | bilan paille faux dans STOCKS/COUTS                                                 |

**Ce ticket (2) et le ticket 8 doivent être traités de concert** : ils partagent
l'intégralité des fixes (P1–P4). La seule différence de périmètre :

- **Ticket 8** met l'accent sur le **calcul** (conso aliment + logement, production,
  stock final) et la **distinction** aliment/logement (P5, « souhaitable »).
- **Ticket 2** met l'accent sur la **comptabilisation dans STOCKS ET COUTS** — c'est-à-dire
  que les lignes « paille aliment » et « paille logement » **doivent apparaître avec des
  valeurs cohérentes** dans le tableau de bilan.

### 1.3 Ce qui est déjà en place (à ne pas refaire)

La structure de comptabilisation paille existe déjà dans `report.js` :

- `getStrawStock` (L159) : ligne `STRAW` (category `3_straw`) avec
  `initialStock`, `production`, `consommation`, `finalStock`, `purchase`, coûts.
- `getConsumptionForStraw` (mixins L588) : somme conso aliment + conso logement.
- `getConsumptionOfNonFoodStraw` (mixins L710) : conso logement via `straw_requirement`.

➡️ **Il n'y a pas à créer de ligne paille** : il faut **corriger les valeurs** qui
alimentent cette ligne (P1–P4) et **la décliner en deux sous-lignes** (P5) pour que la
comptabilisation soit lisible (aliment vs logement), comme dans l'Excel de référence
(image009).

---

## 2. Recommandations (plan de correction)

> **Traiter de concert avec le ticket 8** (même bloc paille). Le plan ci-dessous est
> **identique** au ticket 8 §2 ; on ne le répète pas, on se renvoie.

### 2.1 Fixes (détail dans le ticket 8 §2)

1. **P1 — Paille distribuable** : ajouter `STRAW` dans `barnStockItems`
   (`referential.js`) + carte ration « Paille » avec `stock_correspondant = STRAW`
   (`fichier_type_ration.csv`). → la paille aliment est distribuée et comptée.
2. **P2 — Production paille** : `Rdt_paille` est déjà mappé sur `Stic.rendement`
   (rendement **paille** — vérifié dans le CSV) ; `setTotalStrawStock` somme
   `rendement × surface`. → production cohérente, sans changement backend.
3. **P3 — Conso logement** : formule en UGB (`straw_requirement × nb_animaux ×
UGB_animal × jours / 1000`). → conso logement cohérente.
4. **P4 — Stock final** : `initialStock + production − consommation`. → bilan cohérent.
5. **P5 — Deux sous-lignes** : dans `report.js` `getStrawStock`, afficher
   `Paille (alimentation)` et `Paille (logement)` séparément. → comptabilisation lisible
   (c'est exactement la demande du ticket 2 : « la paille distribuée en alimentation »
   ET « la paille des bâtiments (litière) » doivent être comptabilisées).

### 2.2 Vérification spécifique au ticket 2 (STOCKS ET COUTS)

Après les fixes P1–P5, vérifier dans le tableau _STOCKS ET COUTS_ :

- la section « La paille » montre **deux lignes** (aliment + logement) avec des
  consommations **non nulles et cohérentes** quand il y a de la paille distribuée et/ou
  des logements paillés ;
- la **production** paille = somme des `Rdt_paille` des baguettes utilisées ;
- le **stock final** = stock initial + production − (conso aliment + conso logement) ;
- les **coûts** (achat/vente/coût production) s'appliquent sur la paille globale
  (pas de double comptage entre les deux sous-lignes).

### 2.3 Tests à ajouter

- Voir [ticket-8](ticket-8-paille-aucune-conso.md) §2.6 (tests conso aliment, logement,
  stock final, production).
- Test additionnel spécifique ticket 2 : **lignes de STOCKS ET COUTS** — vérifier que
  `getStrawStock` retourne bien deux sous-lignes avec les bonnes valeurs de
  `consommation` (aliment ≠ 0 si paille distribuée, logement ≠ 0 si
  `straw_requirement > 0`).

---

## 3. Fichiers impactés (récap)

Identiques au ticket 8 §3 :

| Fichier                                                                   | Changement                                                                                                                 |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `services/frontend/ui/src/store/modules/referential.js` (L42-52)          | ajouter `STRAW` dans `barnStockItems` (P1)                                                                                 |
| `services/backend/referential/fichier_type_ration.csv`                    | `stock_correspondant = STRAW` sur la ligne « Paille » (P1)                                                                 |
| `services/frontend/ui/src/store/modules/mixins.js`                        | `setTotalStrawStock` (P2, `rendement` × surface), `getConsumptionOfNonFoodStraw` (P3), `getFinalStockByBarnStockItem` (P4) |
| `services/frontend/ui/src/store/modules/report.js` (`getStrawStock` L159) | deux sous-lignes paille aliment/logement (P5)                                                                              |
| `tests/unit/vuex/straw.spec.js` (nouveau)                                 | tests paille (aliment, logement, stock final, production, lignes STOCKS/COUTS)                                             |

> ℹ️ **Pas de changement backend** : `Rdt_paille` est déjà dans `Stic.rendement`
> (ticket 8 §2.2) ; pas de migration, pas de re-seed.

---

## 4. Critères d'acceptation

1. La paille **distribuée en alimentation** apparaît dans _STOCKS ET COUTS_ (ligne
   « Paille (alimentation) ») avec une consommation cohérente.
2. La paille **logement (litière)** apparaît dans _STOCKS ET COUTS_ (ligne « Paille
   (logement) ») avec une consommation cohérente (`straw_requirement × présence × nb
animaux × UGB`).
3. La **production** paille correspond aux `Rdt_paille` des baguettes (pas aux
   rendements grain).
4. Le **stock final** paille = stock initial + production − consommation totale.
5. Pas de double comptage entre les deux sous-lignes dans les totaux/coûts.

## 5. Risques / points d'attention

- **Couplage fort avec le ticket 8** : ne pas ouvrir deux PR séparés sur le même bloc
  paille — **un seul** traitement (les deux tickets partagent P1–P5).
- **Couplage avec le ticket 1** : la paille aliment distribuable dépend du fix du
  ticket 1 (cartes custom distribuable) + `STRAW` dans `barnStockItems`.
- **Changement backend** (P2) : migration + re-seed. À planifier.
- **Ne pas mélanger avec le ticket 3** (unités t/qtx) : le passage paille en tonnes est
  déjà fait (`/1000`) ; le ticket 3 est séparé.

## 6. Estimation

**Partagée avec le ticket 8** (même travail) : voir
[ticket-8](ticket-8-paille-aucune-conso.md) §6 — **~3,25 j** au total pour le bloc paille
(tickets 2 + 8), hors ticket 3 (unités), à traiter après le ticket 1.
