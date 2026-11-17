# Ticket 9 — Bilan : réordonner les onglets (STOCKS ET COUTS d'abord)

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §9.
> Statut : **✅ Implémenté (2026-11-17)** · Priorité : **basse** · Type : correction
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Ordre des onglets : STOCK et COUT | Travail | Bilan Global

### 1.2 État actuel

L'ordre des onglets du Bilan est défini par `moduleList`
(`components/parts/report/modules/Config.js` L1-28) :

```js
export const moduleList = [
  { name: 'Global',     moduleName: 'Global',     ... },  // Bilan Global
  { name: 'Work',       moduleName: 'Work',       ... },  // Travail
  { name: 'StockNcost', moduleName: 'StockNcost', ... },  // Stocks et coûts
]
```

`Report.vue` `loadModules()` (L107) itère `moduleList` dans cet ordre pour
charger les composants et construire les onglets.

➡️ **C'est un simple réordonnancement** : passer `StockNcost` en premier,
puis `Work`, puis `Global`.

### 1.3 Point de vigilance

`StockNcost` a `requiredState: []` (L24) — il ne dépend d'aucun état requis,
donc le charger **premier** ne pose pas de problème de dépendance. `Global`
requiert `['dimensioning']` (L9) — il sera chargé **en dernier**, ce qui est
cohérent (le bilan global agrège les autres).

---

## 2. Recommandation (plan de correction) ✅ **Implémenté (2026-11-17)**

**Fichier** : `components/parts/report/modules/Config.js`

Réordonner `moduleList` :

```js
export const moduleList = [
  { name: 'StockNcost', moduleName: 'StockNcost', ... },  // 1. Stocks et coûts
  { name: 'Work',       moduleName: 'Work',       ... },  // 2. Travail
  { name: 'Global',     moduleName: 'Global',     ... },  // 3. Bilan Global
]
```

Aucun autre changement : `Report.vue` consomme `moduleList` tel quel.

---

## 3. Fichiers impactés (récap)

| Fichier                                         | Changement                                         |
| ----------------------------------------------- | -------------------------------------------------- |
| `src/components/parts/report/modules/Config.js` | réordonner `moduleList` (StockNcost, Work, Global) |

---

## 4. Critères d'acceptation

1. Dans _Bilan_, l'ordre des onglets est **Stocks et coûts | Travail | Bilan
   Global**.
2. Les trois onglets chargent et s'affichent correctement (pas de régression).

## 5. Risques / points d'attention

- **Quasi nul** : c'est un réordonnancement d'un tableau. Vérifier juste que
  `StockNcost` (premier) ne dépend pas d'un module chargé avant lui
  (`requiredState: []` → OK).
- **Lien avec les tickets 2/8/12** : l'onglet Stocks et coûts sera le **premier
  vu** — les bugs paille/tourteaux y seront plus visibles. Rien à changer ici,
  mais le réordonnancement met en avant les corrections à venir.

## 6. Estimation

| Bloc                          | Effort     |
| ----------------------------- | ---------- |
| Réordonnancement `moduleList` | ~0,1 j     |
| **Total**                     | **~0,1 j** |
