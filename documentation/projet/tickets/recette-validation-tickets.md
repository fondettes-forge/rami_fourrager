# Recette de validation — Tickets traités (Rami liste)

> Recette de **validation manuelle (UI)** des tickets implémentés, en complément des
> tests unitaires.
> Tickets couverts : **1 (+6), 2+8 (bloc paille), 3 (2.1 paille en tonnes), 4, 5, 7, 9, 11, 13, 18, 22**.
> Date : 2026-11-17 (maj 2026-11-18 : ajout tickets 11, 18 ; maj 2026-11-24 : ajout tickets 7, 22).
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

## Ticket 7 — Décliner une baguette entre années climatiques

| #   | Action                                                                                                                           | Résultat attendu                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Baguettes fourrage → Ajouter_                                                                              | le bloc de gauche s'intitule **« Décliner une baguette vers une autre année climatique »** ; le select année s'appelle **« Année climatique de destination »** et l'autocomplete **« Baguette source (à copier) »** |
| 2   | Choisir un site + une année climatique **sèche**, sélectionner une baguette **source** (année **normale**) et cliquer **Copier** | les champs sont pré-remplis avec les valeurs de la source                                                                                                                                                           |
| 3   | Vérifier le select « Année climatique de destination » après le Copier                                                           | il affiche bien l'année **sèche** (destination), pas l'année de la source (fix B1)                                                                                                                                  |
| 4   | Enregistrer → datatable des baguettes du workspace                                                                               | la baguette est créée **sur l'année climatique de destination**                                                                                                                                                     |
| 5   | _(Option 2.3, à clarifier avec Antoine)_                                                                                         | la déclinaison **depuis l'édition** d'une baguette existante n'est pas encore possible (bloc copier désactivé en édition)                                                                                           |

---

## Ticket 22 — Colonne « source » des baguettes

| #   | Action                                                                     | Résultat attendu                                                                                                                                  |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Baguettes fourrage → Ajouter_ → onglet « Le détail » | un champ **« Source de la baguette »** existe (libellé : ex. INRAE, expérimentation locale, estimation) ; facultatif                              |
| 2   | Saisir une source (ex. « estimation ») et enregistrer                      | la baguette est créée avec sa source                                                                                                              |
| 3   | DataTable des baguettes du workspace                                       | une colonne **« Source »** apparaît (entre « Nom » et « Actions ») et affiche la valeur saisie                                                    |
| 4   | Backend (si référentiel déployé)                                           | après `alembic upgrade head` + re-seed, l'API `stic` renvoie `source` ; les baguettes du référentiel ont `source` vide (colonne vide dans le CSV) |

---

## Ticket 4 — Bouton AJOUTER Présence

| #   | Action                                            | Résultat attendu                                                             |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | _Troupeau → lot → onglet Présence_                | **plus de bouton « AJOUTER »** (la duplication par période reste disponible) |
| 2   | _Troupeau → lot → onglets Aliments et Concentrés_ | le bouton « AJOUTER » **est toujours présent et fonctionnel**                |

---

## Ticket 18 — Tooltip « nb génisses à garder »

| #   | Action                                                                                                        | Résultat attendu                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Troupeau → Ajouter un lot_ (HerdModal) → survoler l'icône d'aide (❓) à droite du champ « Nombre d'animaux » | un **tooltip** s'affiche : « Pour un lot de génisses : saisir le nombre de génisses gardées (mises à la reproduction). Le nombre total de génisses est supérieur (génisses vendues + génisses gardées), c'est pourquoi le nombre d'animaux total du système apparaît supérieur. » |
| 2   | _Troupeau → un lot → onglet Détails_ (BatchDetails) → survoler l'icône d'aide du champ « Nombre d'animaux »   | le **même tooltip** s'affiche                                                                                                                                                                                                                                                     |
| 3   | Cliquer dans le champ                                                                                         | le champ reste fonctionnel (saisie du nombre, règles requises/entier) — le tooltip n'interfère pas                                                                                                                                                                                |

---

## Ticket 5 — Dupliquer une carte ration

| #   | Action                                                                                                      | Résultat attendu                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | _Mes configurations → Mes cartes rations_ → chaque ligne a une icône **copier** (📄) en plus de delete/edit | 3 icônes : copier, delete, edit                                                                                                      |
| 2   | Cliquer sur l'icône copier d'une carte (ex. « Foin Luzerne Brenne »)                                        | le modal s'ouvre **pré-rempli** : nom = « Foin Luzerne Brenne **(copie)** », stock correspondant + 9 valeurs nutritionnelles copiées |
| 3   | Changer le nom en « Foin Luzerne Brenne 2 » et valider                                                      | une **nouvelle carte** est créée et listée ; la carte source est **inchangée**                                                       |
| 4   | _Troupeau → lot → Ajouter un aliment_                                                                       | la carte dupliquée **apparaît** dans le select (ticket 1)                                                                            |
| 5   | Distribuer la carte dupliquée → _Bilan → Stocks et coûts_                                                   | la consommation du code de stock reflète la distribution                                                                             |

> La carte dupliquée n'a **pas l'`id`** de la source (id dérivé à la volée par
> `mergeLists`, ticket 1 §2.4). Le nom est préfixé « (copie) » pour que
> l'utilisateur le renomme.

---

## Ticket 15 — AnimalProfileModal : batch_type + rafraîchissement profils

| #   | Action                                                                            | Résultat attendu                                                                                                               |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | _Mes configurations → Mes profils animaux_ → cliquer « Ajouter un profil animal » | le select **« Type d'animal »** est **à blanc** (pas de valeur résiduelle)                                                     |
| 2   | Sélectionner un type d'animal (ex. « Vache laitière »)                            | la liste des profils (bloc « Copier un profil existant ») se **rafraîchit** avec les profils correspondant au type sélectionné |
| 3   | Changer le type d'animal (ex. → « Génisse »)                                      | la liste des profils se **rafraîchit** à nouveau ; le profil copié est **vidé**                                                |
| 4   | Essayer de valider sans sélectionner de type d'animal                             | la soumission est **bloquée** (règle `required` sur le select batch_type)                                                      |
| 5   | _(Mode édition)_ Cliquer « Modifier » sur un profil existant                      | le select batch_type est **pré-rempli** avec le type du profil (pas réinitialisé)                                              |

---

## Ticket 17 — Validation formulaires : champs obligatoires (profil animal)

| #   | Action                                                                               | Résultat attendu                                                                                                                        |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Mes profils animaux_ → « Ajouter un profil animal »            | les champs **Type d'animal**, **Nom du profil**, **Âge au vêlage** sont marqués **obligatoires** (astérisque `*` + règle de validation) |
| 2   | Laisser les 3 champs obligatoires vides et cliquer « Enregistrer »                   | la soumission est **bloquée** ; message d'erreur « champ requis » sous chaque champ vide                                                |
| 3   | Remplir les 3 champs obligatoires, laisser les autres (poids, NEC, lactation…) vides | la soumission est **validée** (champs facultatifs)                                                                                      |
| 4   | Saisir une valeur non numérique dans « Poids au vêlage »                             | règle `number` : message d'erreur « valeur numérique requise »                                                                          |

> **Baguettes** (`SticModal.vue`) : **à faire** — marquer les champs obligatoires
> (name, type, surface) de la même façon. (Groupe B avec le ticket 7.)

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
