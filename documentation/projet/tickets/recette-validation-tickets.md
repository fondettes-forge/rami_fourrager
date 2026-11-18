# Recette de validation — Tickets traités (Rami liste)

> Recette de **validation manuelle (UI)** des tickets implémentés, en complément des
> tests unitaires.
> Tickets couverts : **1 (+6), 2+8 (bloc paille), 3 (2.1 paille en tonnes), 4, 9, 11, 13**.
> Date : 2026-11-17 (maj 2026-11-18 : ajout ticket 11).
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

| #   | Action                                                                                                                          | Résultat attendu                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Mes cartes rations_ → créer « Foin Luzerne Brenne » (stock correspondant = **Foin FH**)                   | carte créée et listée                                                                   |
| 2   | _Troupeau → un lot → Ajouter un aliment_                                                                                        | **la carte apparaît** dans le select (avec les référentiels)                            |
| 3   | **Cas limite (le vrai bug)** : simuler une liste référentielle vide (mode offline / API down, ou vider `feed_types` en console) | la carte custom **apparaît toujours**, pas d'erreur / `TypeError`                       |
| 4   | Distribuer la carte à un lot sur une période → _Bilan → Stocks et coûts_                                                        | la consommation du code **FH** reflète la distribution                                  |
| 5   | _(fix C3)_ _Troupeau → lot → Ajouter un concentré_                                                                              | un concentré custom créé apparaît (pas de doublon, pas de confusion avec les fourrages) |

---

## Ticket 2 + 8 — Bloc paille

| #   | Action                                                                                       | Résultat attendu                                                                                                |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | _Bilan → Stocks et coûts_ → section « La paille »                                            | **3 lignes** : « Paille (alimentation) », « Paille (logement) », + ligne cachée de synthèse (non visible en UI) |
| 2   | **Paille logement** : lot en « Aire paillée intégrale » (`straw_requirement > 0`) + présence | consommation logement **non nulle et cohérente** (kg/UGB/j × UGB × jours, en t)                                 |
| 3   | **Paille aliment** : distribuer une carte « Paille » (STRAW) à un lot                        | consommation aliment **non nulle**                                                                              |
| 4   | **Production**                                                                               | = somme des `Rdt_paille` des baguettes (rendement paille × surface), **pas** aux rendements grain               |
| 5   | **Stock final**                                                                              | = stock initial + production − (conso aliment + conso logement) ; pas de double comptage dans les totaux/coûts  |
| 6   | Graphique « Evolution des stocks » de la Grange                                              | affiche la paille                                                                                               |

---

## Ticket 3 — Paille en tonnes (2.1)

| #   | Action                                                                                          | Résultat attendu                                                                 |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | _Grange_ : champ « Stock de paille disponible au 1er janvier »                                  | libellé **« quantité (en tonnes) »**                                             |
| 2   | Saisir **10** → _Bilan → Stocks et coûts_                                                       | stock initial paille = **10** (pas 10 000)                                       |
| 3   | **Migration** : recharger un workspace ancien où le stock paille était saisi en kg (ex. 10 000) | converti en **10 t** à la charge ; une valeur ≤ 1000 (déjà en t) reste inchangée |
| 4   | _(Backlog BL-1, non fait)_                                                                      | les céréales restent en **qtx** — vérifier que c'est bien le comportement actuel |

---

## Ticket 9 — Ordre des onglets Bilan

| #   | Action                  | Résultat attendu                                                                                |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | _Bilan_                 | ordre des onglets : **Stocks et coûts \| Travail \| Bilan Global**                              |
| 2   | Parcourir les 3 onglets | chaque onglet charge et s'affiche correctement (pas de régression, le bilan global agrège bien) |

---

## Ticket 13 — Ordre des stocks de la Grange

| #   | Action                                                               | Résultat attendu                                                                                                                                                                                                                       |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Grange → Ajouter un stock_                                          | le select propose dans l'ordre : **Foin \| Foin de légumineuses \| Ensilage et enrub. d'herbe \| Ensilage de maïs et sorgho \| Ensilage de légumineuses \| Céréales en grain \| Protéagineux en grain \| autre stock** (Paille en fin) |
| 2   | Table des stocks + select « stock correspondant » des cartes rations | suivent le même ordre                                                                                                                                                                                                                  |
| 3   | Codes                                                                | **inchangés** → calculs/stocks inchangés (pas de régression)                                                                                                                                                                           |

---

## Ticket 11 — Compteur de surface Assolement (2.1)

| #   | Action                                                    | Résultat attendu                                                           |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | _Assolement_ → bloc « Dimensionnement » sous le champ SAU | libellé **« Surface utilisée : X ha / Y ha (SAU) »** affiché               |
| 2   | Saisir une SAU (ex. 100) sans rotation                    | « Surface utilisée : 0 ha / 100 ha (SAU) » en **vert** (ou neutre)         |
| 3   | Ajouter des rotations dont la somme est **< SAU**         | compteur en **orange** + sous-texte « N ha encore disponibles »            |
| 4   | Ajouter des rotations dont la somme = **SAU**             | compteur en **vert** + « Toute la SAU est utilisée »                       |
| 5   | (Cas limite) somme **> SAU** (ex. saisie forcée)          | compteur en **rouge** + « SAU dépassée — réduction de surface nécessaire » |
| 6   | Ajouter/supprimer/éditer une rotation                     | le compteur se met à jour **en temps réel**                                |

> Le 2.1 ne change aucun calcul : il affiche le getter `totalSurfaces` (existant).
> Le **2.2 (retrait des Surfaces à Contraintes)** est un bonus **non fait** —
> à valider avec Antoine avant implémentation.

---

## Ticket 4 — Bouton AJOUTER Présence

| #   | Action                                            | Résultat attendu                                                             |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | _Troupeau → lot → onglet Présence_                | **plus de bouton « AJOUTER »** (la duplication par période reste disponible) |
| 2   | _Troupeau → lot → onglets Aliments et Concentrés_ | le bouton « AJOUTER » **est toujours présent et fonctionnel**                |

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
