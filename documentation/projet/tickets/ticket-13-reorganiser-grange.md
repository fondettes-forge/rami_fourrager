# Ticket 13 — Grange : réorganiser la liste des stocks

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §13.
> Statut : **✅ Implémenté (2026-11-17)** · Priorité : **basse** · Type : correction
> Seche lié : ticket **12** (si Option 2 ajoute `RT`, l'ordre est impacté) ·
> ticket **8** (ajout de `STRAW` dans `barnStockItems` — STRAW conservé en fin)
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Grange : réorganiser la liste. Pour s'y retrouver plus facilement. Ordre
> proposé pour les 8 catégories :
> « Foin, Foin de légumineuses, ensilage et enrub d'herbe, ensilage de maïs et
> sorgho, ensilage de légumineuse, céréales en grain, protéagineux en grain,
> autre stock »

### 1.2 État actuel

La liste des types de stock est **en dur** dans `barnStockItems`
(`store/modules/referential.js` L41-51), **dans l'ordre** :

| #   | Code | Nom                             |
| --- | ---- | ------------------------------- |
| 1   | FH   | Foin                            |
| 2   | EH   | Ensilage et enrubannage d'herbe |
| 3   | EM   | Ensilage de maïs et sorgho      |
| 4   | RC   | Céréales en grain               |
| 5   | RP   | Protéagineux en grain           |
| 6   | AS   | autre stock                     |
| 7   | EL   | Ensilage de légumineuses        |
| 8   | FL   | Foin de légumineuses            |

C'est **cette liste** qui alimente :

- le select « Ajouter un stock » de la Grange (`Barn.vue` L121-128) ;
- la table des stocks de la Grange (ordre d'affichage) ;
- le select `correspondingStock` des cartes rations
  (`workspace/ClassicFeedModal.vue` L46-54) ;
- (indirectement) l'ordre des lignes de STOCKS ET COUTS.

L'ordre demandé par Antoine :

| #   | Nom                        | Code |
| --- | -------------------------- | ---- |
| 1   | Foin                       | FH   |
| 2   | Foin de légumineuses       | FL   |
| 3   | ensilage et enrub d'herbe  | EH   |
| 4   | ensilage de maïs et sorgho | EM   |
| 5   | ensilage de légumineuse    | EL   |
| 6   | céréales en grain          | RC   |
| 7   | protéagineux en grain      | RP   |
| 8   | autre stock                | AS   |

### 1.3 Point de vigilance : les codes ne doivent **pas** changer

Seul **l'ordre** change, **pas** les codes (`FH`, `FL`, …). Les codes sont
référencés partout (`correspondingStock`, `initialStocks`, calculs) — il ne faut
que **réordonner** le tableau, pas renommer.

---

## 2. Recommandation (plan de correction) ✅ **Implémenté (2026-11-17)**

**Fichier** : `store/modules/referential.js` (L41-51)

Réordonner `barnStockItems` dans l'ordre demandé :

```js
barnStockItems: [
  { code: 'FH', name: 'Foin', unity: 'tMS', color: '' },
  { code: 'FL', name: 'Foin de légumineuses', unity: 'tMS', color: '' },
  { code: 'EH', name: "Ensilage et enrubannage d'herbe", unity: 'tMS', color: '' },
  { code: 'EM', name: 'Ensilage de maïs et sorgho', unity: 'tMS', color: '' },
  { code: 'EL', name: 'Ensilage de légumineuses', unity: 'tMS', color: '' },
  { code: 'RC', name: 'Céréales en grain', unity: 'qtx', concentrated: true, color: '' },
  { code: 'RP', name: 'Protéagineux en grain', unity: 'qtx', concentrated: true, color: '' },
  { code: 'AS', name: 'autre stock', unity: 'tMS', color: '' },
  // STRAW conservé en fin (géré séparément — champ dédié paille dans la Grange, ticket 8)
  { code: 'STRAW', name: 'Paille', unity: 't', color: '' },
],
```

Aucun autre changement : le select Grange, la table, le select `correspondingStock`
et STOCKS ET COUTS suivront l'ordre du tableau. Vérifié : tous les accès à
`barnStockItems` sont par `.find(code)` (pas d'index) — l'ordre n'a aucun effet
sur les calculs.

---

## 3. Fichiers impactés (récap)

| Fichier                                     | Changement                  |
| ------------------------------------------- | --------------------------- |
| `src/store/modules/referential.js` (L41-51) | réordonner `barnStockItems` |

---

## 4. Critères d'acceptation

1. Dans la Grange (select « Ajouter un stock » + table des stocks), l'ordre des
   8 catégories est : Foin, Foin de légumineuses, ensilage et enrub d'herbe,
   ensilage de maïs et sorgho, ensilage de légumineuse, céréales en grain,
   protéagineux en grain, autre stock.
2. Le select `correspondingStock` des cartes rations suit le même ordre.
3. Les codes ne changent pas (pas de régression sur les calculs/stocks).

## 5. Risques / points d'attention

- **Coordination avec le ticket 8** : si `STRAW` est ajouté dans
  `barnStockItems` (ticket 8), il faut **choisir sa position** dans l'ordre
  (suggestion : après « autre stock » ou en fin, car la paille est gérée
  séparément). Traiter en cohérence.
- **Coordination avec le ticket 12** : le ticket 12 (Option 2 `RT`) a été
  implémenté (2026-11-24) — `RT` est inséré **après `RP`**, avant `AS`. L'ordre
  final de `barnStockItems` est : `FH, FL, EH, EM, EL, RC, RP, RT, AS, STRAW`.
- **Quasi nul** : c'est un réordonnancement d'un tableau en dur. Vérifier juste
  que l'ordre n'a pas d'effet sur un calcul (il n'y en a pas — les codes sont
  utilisés, pas l'index).
- **Tâche associée du mail** : Antoine doit aussi réordonner le **CSV**
  référentiel (côté backend) pour cohérence — à faire en parallèle (voir
  ticket 12 §5).

## 6. Estimation

| Bloc                                         | Effort     |
| -------------------------------------------- | ---------- |
| Réordonnancement `barnStockItems`            | ~0,1 j     |
| Coordination ticket 8/12 (position STRAW/RT) | ~0,1 j     |
| **Total**                                    | **~0,2 j** |
