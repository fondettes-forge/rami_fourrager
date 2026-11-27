# Recette de validation — Tickets traités (Rami liste)

> Recette de **validation manuelle (UI)** des tickets implémentés, en complément des
> tests unitaires.
> Tickets couverts : **1 (+6), 2+8 (bloc paille), 3 (2.1 paille en tonnes), 4, 5, 7, 9, 10, 11, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24**.
> Date : 2026-11-17 (maj 2026-11-18 : ajout tickets 11, 18 ; maj 2026-11-24 : ajout tickets 7, 22, 12, 23, 10, 16, 24 ; maj 2026-11-25 : ajout tickets 19, 21, 20 ; maj 2026-11-27 : fix crash `soldedStock.RT` sur workspace ancien — ticket 12 / bug paille).
> Index des tickets : [tickets/INDEX.md](tickets/INDEX.md).

---

## Prérequis

- Lancer l'app en local :
  ```bash
  cd services/frontend/ui
  npm run serve        # Node 18 requis
  ```
- Charger le **workspace de démo** (celui qui contient des lots, une grange, un assolement).
- Les tests unitaires (`straw.spec.js` + `referential.spec.js` + `pastureGreen.spec.js` +
  `duplicateSimulation.spec.js` + `site.spec.js` = **46/46**) couvrent déjà la logique ;
  cette recette est la **validation visuelle** des critères d'acceptation.

> **Point de vigilance** : les 4 autres suites unitaires (farm, workspace, herd,
> report) échouaient **déjà sur master avant ces tickets** — ce ne sont pas des
> régressions de ces changements.

---

on a un irrigable à "" au lieu de null
null dans farming méthode au lieu de string

il faut améliorer les commandes make d'update pour pouvoir update un seul fichier avec son nom et non mapping-all

problèem de création

## Ticket 1 (+6) — Carte ration introuvable

| #   | Action                                                                                                                          | Résultat attendu                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Mes cartes rations_ → créer « Foin Luzerne Brenne » (stock correspondant = **Foin FH**)                   | carte créée et listée                                                                   |
| 2   | _Troupeau → un lot → Ajouter un aliment_                                                                                        | **la carte apparaît** dans le select (avec les référentiels)                            |
| 3   | **Cas limite (le vrai bug)** : simuler une liste référentielle vide (mode offline / API down, ou vider `feed_types` en console) | la carte custom **apparaît toujours**, pas d'erreur / `TypeError`                       |
| 4   | Distribuer la carte à un lot sur une période → _Bilan → Stocks et coûts_                                                        | la consommation du code **FH** reflète la distribution                                  |
| 5   | _(fix C3)_ _Troupeau → lot → Ajouter un concentré_                                                                              | un concentré custom créé apparaît (pas de doublon, pas de confusion avec les fourrages) |

on peut pas copier depuis une autre carte ration, les codes doivent être affiché dans le select

OK

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

PAS OK mais en cours faire le point
A vérifier, de quel paille on parle dans Stock de paille disponible au 1er janvier et on peut ajouté de la paille aliment. comment les deux cohabitent-tils ?

la paille et les concentré de la grange doivent être créé de la même manière que touty les autre stocks

il faut véritablement 2 flux les aliments paille, des pailles logements et des paille aliment, les pailles aliments aparaisse dans le tableau des stocks et et le paille logment à part
on a un conflit et un bug

dans stock et cout la paille aliment n'est pas consommée et il manque la ligne paille logement

**fix soldedStock (2026-11-27, ticket 12 §8)** : le workspace de démo n'avait pas de `RT` dans `report.soldedStock` (créé avant le ticket 12) → `setReport` remplaçait tout le store → `state.soldedStock['RT'].purchaseCost` = `TypeError` au rendu du tableau. Correction : `setReport` fusionne désormais avec `defaultSoldedStock()` (codes absents comblés, valeurs saisies conservées). Voir ticket-12 §8.

---

## Ticket 3 — Paille en tonnes (2.1)

| #   | Action                                                                                          | Résultat attendu                                                                 |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | _Grange_ : champ « Stock de paille disponible au 1er janvier »                                  | libellé **« quantité (en tonnes) »**                                             |
| 2   | Saisir **10** → _Bilan → Stocks et coûts_                                                       | stock initial paille = **10** (pas 10 000)                                       |
| 3   | **Migration** : recharger un workspace ancien où le stock paille était saisi en kg (ex. 10 000) | converti en **10 t** à la charge ; une valeur ≤ 1000 (déjà en t) reste inchangée |
| 4   | _(Backlog BL-1, non fait)_                                                                      | les céréales restent en **qtx** — vérifier que c'est bien le comportement actuel |

PAS OK
bug dans stock et cout avec de la paille

---

## Ticket 9 — Ordre des onglets Bilan

| #   | Action                  | Résultat attendu                                                                                |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | _Bilan_                 | ordre des onglets : **Stocks et coûts \| Travail \| Bilan Global**                              |
| 2   | Parcourir les 3 onglets | chaque onglet charge et s'affiche correctement (pas de régression, le bilan global agrège bien) |

OK

---

## Ticket 13 — Ordre des stocks de la Grange

| #                   | Action                                                               | Résultat attendu                                                                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                   | _Grange → Ajouter un stock_                                          | le select propose dans l'ordre : **Foin \| Foin de légumineuses \| Ensilage et enrub. d'herbe \| Ensilage de maïs et sorgho \| Ensilage de légumineuses \| Céréales en grain \| Protéagineux en grain \| autre stock** (Paille en fin) |
| 2                   | Table des stocks + select « stock correspondant » des cartes rations | suivent le même ordre                                                                                                                                                                                                                  |
| 3                   | Codes                                                                | **inchangés** → calculs/stocks inchangés (pas de régression)                                                                                                                                                                           |
| OK mais à améliorer |

il manque une majuscule à autres stock
on peut enlever autres stocks

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

OK

---

## Ticket 12 — Tourteaux dans Stocks et Coûts (Option 2 — RT)

| #   | Action                                                                                                       | Résultat attendu                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Bilan → Stocks et coûts_ → groupe « Les cultures »                                                          | une **ligne « Tourteaux » (RT)** apparaît, en plus de Céréales (RC) et Protéagineux (RP)                                          |
| 2   | Distribuer un tourteau (ex. « Tourteau de colza » 0,35) à un lot sur une période → _Bilan → Stocks et coûts_ | la consommation de la ligne **RT** est **non nulle** et cohérente ; les lignes RC et RP restent à 0 (pas de mélange)              |
| 3   | _Grange_ → section « Concentrés »                                                                            | un **3e champ** « Quantité de tourteaux (en qtx) » existe (stock initial RT), en plus des champs RC et RP                         |
| 4   | Saisir un stock initial RT (ex. 5) → _Bilan → Stocks et coûts_                                               | le stock initial de la ligne **RT** = 5                                                                                           |
| 5   | Table des stocks de la Grange                                                                                | la ligne **RT n'apparaît pas** dans la table générique des stocks fourragers (saisie uniquement dans le champ dédié, comme RC/RP) |
| 6   | _Mes configurations → Cartes rations → stock correspondant_                                                  | le select propose **RT (Tourteaux)** (carte ration tourteau pointable vers RT)                                                    |
| 7   | _(Annexe T4, non traitée)_ : un concentré `RC-RP` (Blé_pois 50-50)                                           | ne remonte nulle part pour l'instant — **à traiter séparément** (à valider avec INRAE : 2a CSV ou 2b parsing)                     |

> **Re-seed** : le CSV `fichier_aliments_concentres.csv` a `stock_correspondant = RT`
> sur les 4 lignes tourteaux — **re-seed du référentiel `ConcentratedFeed` à faire**
> en base pour que la remontée fonctionne sur les concentrés du référentiel.

---

## Ticket 10 — Périodes « vides » (couverture grisée / division par zéro ?)

| #   | Action                                                                                                                                                  | Résultat attendu                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | _Troupeau → lot → Couverture des besoins_ : une période avec des **animaux présents** et **100 % de ration en pâture** mais **production pâture nulle** | la cellule s'affiche en **0 %** (valeur affichée), **pas** en gris « vide »                                  |
| 2   | Une période **sans animaux** (animalCount = 0)                                                                                                          | la cellule s'affiche en **gris / `'-'`** (vraiment vide)                                                     |
| 3   | _(Cas limite)_ Un profil avec **UFL = 0** (besoin énergétique = 0)                                                                                      | la couverture s'affiche en **0** (pas `Infinity`, pas de valeur anormale) — garde anti-division par zéro     |
| 4   | _(Cas limite)_ Un profil avec **PDI = 0** (besoin protéique = 0)                                                                                        | la couverture protéique s'affiche en **0** (pas `Infinity`)                                                  |
| 5   | Mélange : certaines périodes avec animaux, d'autres sans                                                                                                | les périodes avec animaux affichent la valeur (même 0), les autres en gris `'-'`                             |
| 6   | _(V1)_ Survoler une cellule à **0 %** (animaux présents, aucun apport)                                                                                  | un **tooltip** s'affiche : « Couverture 0 % : aucun apport (pâture, fourrage, concentré) sur cette période » |
| 7   | _(V1)_ Survoler une cellule à **50 %** (ou autre valeur > 0)                                                                                            | un **tooltip** s'affiche : « Couverture : 50 % »                                                             |

> **Fait** : V1 (tooltip explicatif) — au survol d'une cellule à 0 %, le message
> « Couverture 0 % : aucun apport (pâture, fourrage, concentré) sur cette période »
> s'affiche. L'option 2.2B (avertissement à la saisie) est hors périmètre.

---

## Ticket 7 — Décliner une baguette entre années climatiques

| #   | Action                                                                                                                           | Résultat attendu                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Baguettes fourrage → Ajouter_                                                                              | le bloc de gauche s'intitule **« Décliner une baguette vers une autre année climatique »** ; le select année s'appelle **« Année climatique de destination »** et l'autocomplete **« Baguette source (à copier) »** |
| 2   | Choisir un site + une année climatique **sèche**, sélectionner une baguette **source** (année **normale**) et cliquer **Copier** | les champs sont pré-remplis avec les valeurs de la source                                                                                                                                                           |
| 3   | Vérifier le select « Année climatique de destination » après le Copier                                                           | il affiche bien l'année **sèche** (destination), pas l'année de la source (fix B1)                                                                                                                                  |
| 4   | Enregistrer → datatable des baguettes du workspace                                                                               | la baguette est créée **sur l'année climatique de destination**                                                                                                                                                     |
| 5   | _(Option 2.3, à clarifier avec Antoine)_                                                                                         | la déclinaison **depuis l'édition** d'une baguette existante n'est pas encore possible (bloc copier désactivé en édition)                                                                                           |

KO
il faut revoir l'UI , le fait d'avoir mis tout à gauche. le selecteur de baguettes à gauche est pour sélectionner la baguette source, on clic sur copier et ça rempli le formulaire de droite.
il faut redéfinir la destination dans un autre composant que celui de la selection de la source.

on doit pouvoir réattribuer à n'import quel site et n'importe quel année climatique d'un site sélectionné.

à la modification on doit pouvoir changer la baguette d'année climatique d'un site sélectionné. donc on peut changer de site et d'année climatique associé au nouveau site.

---

## Ticket 22 — Colonne « source » des baguettes

| #   | Action                                                                     | Résultat attendu                                                                                                                                  |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Baguettes fourrage → Ajouter_ → onglet « Le détail » | un champ **« Source de la baguette »** existe (libellé : ex. INRAE, expérimentation locale, estimation) ; facultatif                              |
| 2   | Saisir une source (ex. « estimation ») et enregistrer                      | la baguette est créée avec sa source                                                                                                              |
| 3   | DataTable des baguettes du workspace                                       | une colonne **« Source »** apparaît (entre « Nom » et « Actions ») et affiche la valeur saisie                                                    |
| 4   | Backend (si référentiel déployé)                                           | après `alembic upgrade head` + re-seed, l'API `stic` renvoie `source` ; les baguettes du référentiel ont `source` vide (colonne vide dans le CSV) |
| OK  |

---

## Ticket 19 — Graphique « pâture verte disponible et besoin du troupeau »

| #   | Action                                                                                           | Résultat attendu                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Assolement_ → colonne de droite, sous le graphique de l'assolement (heatmap)                    | un **nouveau graphique** « Pâture verte disponible et besoin du troupeau » s'affiche (barres groupées, 2 séries, P1–P13)                          |
| 2   | Saisir un assolement avec des pâtures → « Appliquer à la simulation » → revenir sur _Assolement_ | la série **« Pâture verte disponible »** (barres vert foncé) est non nulle sur les périodes où il y a production de pâture                        |
| 3   | Avoir des lots en pâturage (stratégie de pâturage ≠ 0) → appliquer                               | la série **« Besoin du troupeau »** (barres vert clair) est non nulle sur ces périodes, cohérente avec la consommation pâturée                    |
| 4   | Survoler une période (tooltip)                                                                   | les **2 valeurs** (disponible + besoin) en **kgMS** s'affichent                                                                                   |
| 5   | **Cas limite** : simulation sans assolement appliqué (pas de `totalAvailablePastureByPeriod`)    | pas de crash — le graphique affiche le message « Aucune donnée de pâture disponible (saisissez un assolement puis appliquez-le à la simulation) » |
| 6   | Vérifier les autres modules (_Troupeau_, _Bilan_)                                                | pas de régression (le getter est **affichage pur** — il n'affecte aucun calcul existant)                                                          |

> **Point de vigilance (unité)** : les deux séries sont en **kgMS/période** (comme
> `production_total`). L'unité exacte du « besoin » dans l'Excel de référence est
> à confirmer avec INRAE (Antoine) — si l'Excel est en kgMS/jour ou tMS, il faudra
> ajuster le facteur d'affichage uniquement (getter `getPastureGreenComparison`).

OK
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

OK mais à améliorer
la duplication fonctionne mais il faut appliquer aussi le pattern de duplication des valeurs comme pour les baguettes et les profils

---

## Ticket 23 — Feedback login (erreur / user inexistant)

| #   | Action                                                                                | Résultat attendu                                                                                                                  |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Saisir un **email invalide** ou un **mot de passe incorrect** → cliquer « Connexion » | un **message d'erreur** s'affiche dans un `v-alert` rouge : « Identifiant ou mot de passe incorrect. » (ou le message du backend) |
| 2   | Cliquer sur la croix (✕) du `v-alert`                                                 | l'alerte est **fermée** (dismissible) ; le formulaire reste visible                                                               |
| 3   | Resoumettre le formulaire avec les **mêmes mauvais identifiants**                     | l'alerte **réapparaît** (l'erreur est réinitialisée à chaque soumission, puis re-déclenchée)                                      |
| 4   | Saisir les **bons identifiants** → cliquer « Connexion »                              | l'alerte n'apparaît pas ; redirection vers `/workspace`                                                                           |
| 5   | _(Optionnel)_ Backend sans message d'erreur                                           | le fallback « Identifiant ou mot de passe incorrect. » s'affiche (si `err.response.data.message` est vide)                        |

> Le message d'erreur provient du backend (`err.response.data.message`). Si le backend
> ne renvoie pas de message, le fallback est `auth.login.error.invalid`. L'alerte est
> dismissible et se réinitialise à chaque soumission.

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

## Ticket 16 — Export : nom obligatoire + colonnes manquantes

| #   | Action                                                                                            | Résultat attendu                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Export_ → créer un mapping → laisser le **nom vide** et ajouter des champs  | le bouton **« Enregistrer » est désactivé** (règle `required` sur le nom du mapping)                                                           |
| 2   | Saisir un nom + ajouter au moins un champ → cliquer « Enregistrer »                               | le mapping est **enregistré** et listé                                                                                                         |
| 3   | Sélectionner une simulation **vide** (pas d'assolement ou pas de troupeau) → cliquer « Exporter » | un **toast d'avertissement** s'affiche : « Aucune donnée à exporter. Vérifiez que la simulation sélectionnée a un assolement et un troupeau. » |
| 4   | Sélectionner une simulation **complète** (assolement + troupeau) → cliquer « Exporter »           | l'aperçu s'ouvre avec les **colonnes et valeurs** du mapping (pas de colonne manquante)                                                        |
| 5   | Vérifier que les **colonnes** du mapping sont présentes dans l'aperçu **et** le CSV téléchargé    | les colonnes sont **identiques** dans les deux (même mapping)                                                                                  |

> **Note** : le TODO « les colonnes n'apparaissent » est une **méprise** : les
> colonnes sont bien présentes (générées depuis `state.mapping.fields`), mais les
> valeurs sont vides si la simulation est vide (pas de rotations ou pas de batchs).
> Le message d'avertissement (étape 3) clarifie ce point.

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

## Ticket 24 — Métadonnées référentiel (résumé baguette + tooltip consolidé)

> **Prérequis spécifique** : `alembic upgrade head` (migration `7c4b9e12f0a3`) +
> re-seed du référentiel (les colonnes `resume` / `description` sont vides dans
> les CSV tant qu'INRAE ne les remplit pas — les tooltips ne s'affichent que si
> au moins une métadonnée est renseignée).

| #   | Action                                                                                        | Résultat attendu                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Mes configurations → Baguettes fourrage → Ajouter_ → onglet « Le détail »                    | un champ **« Résumé de la baguette »** existe (textarea, facultatif)                                                                                      |
| 2   | Saisir un résumé + une source, enregistrer → datatable des baguettes du workspace             | au **survol** du nom de la baguette, un **tooltip** s'affiche avec le résumé + « Source : … » + « Dernière mise à jour : … » (lignes vides non affichées) |
| 3   | _Mes configurations → Baguettes fourrage → Ajouter_ → selects « Site » / « Année climatique » | au **survol** des options du select, le tooltip consolidé du site / de l'année climatique s'affiche (description + date MAJ)                              |
| 4   | _Troupeau → lot → onglets Aliments / Concentrés_                                              | au **survol** du libellé de l'aliment dans la table, le tooltip consolidé du type de ration / concentré s'affiche (description + source + date MAJ)       |
| 5   | Baguette / site / type de ration **sans aucune métadonnée** (CSV vides)                       | **aucun tooltip** (fallback simple, pas de tooltip vide) ; l'affichage du libellé est inchangé                                                            |
| 6   | Tests unitaires : `metadata.spec.js`                                                          | **9/9** (métadonnées conservées par la fusion, robustesse legacy, computed du tooltip)                                                                    |

> La `source` des types de ration / aliments concentrés est lue sur
> `nutritional_values.source` (mapping existant, inchangé) ; la `source` des
> baguettes / sites / années climatiques est lue sur l'entité.

la source et la description s'affiche bien dans le worspace mais
---

## Ticket 21 — Duplication de simulation (« Enregistrer-sous »)

A revoir

| #   | Action                                                                  | Résultat attendu                                                                                                             |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Espace de travail → Mes Simulations_                                   | chaque ligne a une icône **copie** (📄 grise) dans la colonne Actions (entre edit et delete)                                 |
| 2   | Cliquer sur l'icône copie d'une simulation                              | un **modal** s'ouvre : « Dupliquer la simulation », champ « Nom de la copie » **pré-rempli** avec `« Nom original » (copie)` |
| 3   | Renommer en « Scénario B » et valider                                   | une **nouvelle simulation** apparaît dans la liste avec le nom saisi ; toast de succès                                       |
| 4   | Charger la **copie** → vérifier _Assolement_ / _Grange_ / _Troupeau_    | **mêmes données** que l'originale (rotations, stocks, lots) — copie profonde                                                 |
| 5   | Modifier la copie (ex. changer une surface) → recharger l'**originale** | l'originale est **inchangée** (pas de partage de référence)                                                                  |
| 6   | Vérifier la ligne de la copie dans la liste                             | **non chargée** (pas de surlignage) ; l'originale reste bien chargée si elle l'était (pas de « vol » du `loaded`)            |
| 7   | **Cas limite** : laisser le nom de la copie vide et valider             | la soumission est **bloquée** (règle `required`)                                                                             |
| 8   | Tests unitaires : `duplicateSimulation.spec.js`                         | **4/4** (copie profonde, source non modifiée, loaded=false, date)                                                            |

> La duplication est **locale au workspace** (pas de backend) — cohérent avec
> l'architecture verrouillée. La copie est référencée par objet (pas d'`id`).

bug : le formulaire de duplication ne se referme pas même avec le bouton annulé

---

## Ticket 20 — Gestion sites / années climatiques (workspace local, option A)

| #   | Action                                                                          | Résultat attendu                                                                                                                                         |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _Espace de travail → Mes Sites & Années_ (nouvel onglet)                        | 2 datatables côte à côte : **« Mes Sites »** (gauche) + **« Mes Années climatiques »** (droite)                                                          |
| 2   | Cliquer « Créer un site » → saisir nom/code/description → valider               | le site est créé et listé à gauche ; toast de succès                                                                                                     |
| 3   | Cliquer l'icône calendrier (📅) d'un site → « Créer une année climatique »      | le modal s'ouvre avec le **site pré-sélectionné** ; saisir nom → valider → l'année climatique est listée à droite                                        |
| 4   | Cliquer « Créer une année climatique » (bouton global, sans site sélectionné)   | le bouton est **désactivé** (il faut sélectionner un site d'abord)                                                                                       |
| 5   | **Triptyque** : créer un site → une année climatique → une baguette (SticModal) | dans le formulaire baguette, le select « Site » propose **base + custom** ; le select « Année climatique » propose **base + custom** du site sélectionné |
| 6   | Édition : cliquer l'icône edit d'un site / d'une année climatique               | le modal s'ouvre **pré-rempli** ; les modifications sont enregistrées                                                                                    |
| 7   | Suppression : cliquer l'icône delete d'un site / d'une année climatique         | confirmation → l'item est supprimé de la liste                                                                                                           |
| 8   | Tests unitaires : `site.spec.js`                                                | **12/12** (fusion siteList, climaticYearList, getSiteByClimaticYearId, getClimaticYearById)                                                              |

> **Option A (workspace local)** : les sites/années créés vivent dans `workspace.sites` /
> `workspace.climaticYears` (pas de backend, pas de migration, pas d'endpoint). Les ids
> custom sont dérivés à la volée (pattern `mergeListsById`, ticket 1 §2.4). La référence
> des baguettes custom vers une année climatique custom reste cohérente via
> `getClimaticYearById` / `getSiteByClimaticYearId` (base + custom).

---

## Tests unitaires (en une commande)

```bash
cd services/frontend/ui
npx --no-install vue-cli-service test:unit --testPathPattern "straw|referential|concentrated|coverage|metadata|pastureGreen|duplicateSimulation|site"
```

→ **73/73 ✅** (straw 15 + referential 7 + concentrated 12 + coverage 6 +
metadata 9 + pastureGreen 8 + duplicateSimulation 4 + site 12).

## Build (optionnel)

```bash
cd services/frontend/ui
npm run build
```

→ vérifier qu'il n'y a pas d'erreur de compilation.
