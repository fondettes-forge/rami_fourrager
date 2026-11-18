# Recette de validation — Tickets traités (Rami liste)

> Recette de **validation manuelle (UI)** des tickets implémentés, en complément des
> tests unitaires.
> Tickets couverts : **1 (+6), 2+8 (bloc paille), 3 (2.1 paille en tonnes), 4, 9, 13**.
> Date : 2026-11-17.
> Index des tickets : [tickets/INDEX.md](tickets/INDEX.md).

---

## Prérequis

- Lancer l'app en local :
  ```bash
  cd services/frontend/ui
  npm run serve        # Node 18 requis
  ```
- Charger le **workspace de démo** (celui qui contient des lots, une grange, un assolement).
- Les tests unitaires (`straw.spec.js` + `referential.spec.js` = **22/22**) couvrent
  déjà la logique ; cette recette est la **validation visuelle** des critères
  d'acceptation.

> **Point de vigilance** : les 4 autres suites unitaires (farm, workspace, herd,
> report) échouaient **déjà sur master avant ces tickets** — ce ne sont pas des
> régressions de ces changements.

---

## Ticket 1 (+6) — Carte ration introuvable

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | *Mes configurations → Mes cartes rations* → créer « Foin Luzerne Brenne » (stock correspondant = **Foin FH**) | carte créée et listée |
| 2 | *Troupeau → un lot → Ajouter un aliment* | **la carte apparaît** dans le select (avec les référentiels) |
| 3 | **Cas limite (le vrai bug)** : simuler une liste référentielle vide (mode offline / API down, ou vider `feed_types` en console) | la carte custom **apparaît toujours**, pas d'erreur / `TypeError` |
| 4 | Distribuer la carte à un lot sur une période → *Bilan → Stocks et coûts* | la consommation du code **FH** reflète la distribution |
| 5 | *(fix C3)* *Troupeau → lot → Ajouter un concentré* | un concentré custom créé apparaît (pas de doublon, pas de confusion avec les fourrages) |

---

## Ticket 2 + 8 — Bloc paille

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | *Bilan → Stocks et coûts* → section « La paille » | **3 lignes** : « Paille (alimentation) », « Paille (logement) », + ligne cachée de synthèse (non visible en UI) |
| 2 | **Paille logement** : lot en « Aire paillée intégrale » (`straw_requirement > 0`) + présence | consommation logement **non nulle et cohérente** (kg/UGB/j × UGB × jours, en t) |
| 3 | **Paille aliment** : distribuer une carte « Paille » (STRAW) à un lot | consommation aliment **non nulle** |
| 4 | **Production** | = somme des `Rdt_paille` des baguettes (rendement paille × surface), **pas** aux rendements grain |
| 5 | **Stock final** | = stock initial + production − (conso aliment + conso logement) ; pas de double comptage dans les totaux/coûts |
| 6 | Graphique « Evolution des stocks » de la Grange | affiche la paille |

---

## Ticket 3 — Paille en tonnes (2.1)

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | *Grange* : champ « Stock de paille disponible au 1er janvier » | libellé **« quantité (en tonnes) »** |
| 2 | Saisir **10** → *Bilan → Stocks et coûts* | stock initial paille = **10** (pas 10 000) |
| 3 | **Migration** : recharger un workspace ancien où le stock paille était saisi en kg (ex. 10 000) | converti en **10 t** à la charge ; une valeur ≤ 1000 (déjà en t) reste inchangée |
| 4 | *(Backlog BL-1, non fait)* | les céréales restent en **qtx** — vérifier que c'est bien le comportement actuel |

---

## Ticket 9 — Ordre des onglets Bilan

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | *Bilan* | ordre des onglets : **Stocks et coûts \| Travail \| Bilan Global** |
| 2 | Parcourir les 3 onglets | chaque onglet charge et s'affiche correctement (pas de régression, le bilan global agrège bien) |

---

## Ticket 13 — Ordre des stocks de la Grange

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | *Grange → Ajouter un stock* | le select propose dans l'ordre : **Foin \| Foin de légumineuses \| Ensilage et enrub. d'herbe \| Ensilage de maïs et sorgho \| Ensilage de légumineuses \| Céréales en grain \| Protéagineux en grain \| autre stock** (Paille en fin) |
| 2 | Table des stocks + select « stock correspondant » des cartes rations | suivent le même ordre |
| 3 | Codes | **inchangés** → calculs/stocks inchangés (pas de régression) |

---

## Ticket 4 — Bouton AJOUTER Présence

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | *Troupeau → lot → onglet Présence* | **plus de bouton « AJOUTER »** (la duplication par période reste disponible) |
| 2 | *Troupeau → lot → onglets Aliments et Concentrés* | le bouton « AJOUTER » **est toujours présent et fonctionnel** |

---

## Tests unitaires (en une commande)

```bash
cd services/frontend/ui
npx --no-install vue-cli-service test:unit --testPathPattern "straw|referential"
```

→ **22/22 ✅** (fusion des listes, bloc paille, unités paille).

## Build (optionnel)

```bash
cd services/frontend/ui
npm run build
```

→ vérifier qu'il n'y a pas d'erreur de compilation.
