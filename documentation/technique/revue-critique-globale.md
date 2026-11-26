# Revue critique globale du Rami

> **Document de revue** : l'ensemble de l'application, pas seulement le Bilan.
> Deux volets, dans cet ordre :
>
> 1. **Partie 1 — Regard agronome** : ce que le modèle fait bien, ce qu'il
>    simplifie ou fausse, ce qui manque pour remplir sa mission d'**outil de
>    simulation** (faisabilité, climats, leviers) — du point de vue d'un
>    ingénieur agronome / conseiller fourrage (chambre d'agriculture).
> 2. **Partie 2 — Regard technique** : solidité de l'implémentation
>    (architecture, cohérence des calculs, robustesse, maintenance, tests).
>
> **Mission du Rami** : outil de **simulation** pour estimer la faisabilité
> d'un projet, l'impact des différents climats sur l'exploitation, les leviers
> mobilisables et leurs impacts sur un système fourrager.
>
> État du code : 2026-11-18.
> Compléments : [synthese-exploitation-simulee.md](synthese-exploitation-simulee.md)
> (formules), [synthese-agronomique.md](synthese-agronomique.md) (fond agronomique),
> [cycle-de-vie-des-items.md](cycle-de-vie-des-items.md) (traçabilité par item),
> [bilan-expert-review.md](bilan-expert-review.md) (revue détaillée du Bilan),
> [tickets/INDEX.md](../projet/tickets/INDEX.md).

**Lecture** :

- Chaque constat est identifié par un code : **A#** (agronome), **T#** (technique).
- Les constats du Bilan ne sont pas refaits ici : ils renvoient à
  [bilan-expert-review.md](bilan-expert-review.md).
- **§3** croise les deux regards et propose une **roadmap priorisée** globale.

---

# Partie 1 — Regard agronome (ingénieur agronome / conseiller fourrage)

> _« J'ai lu ce que l'outil fait. La démarche est saine : partir de l'assolement,
> produire, distribuer, faire le compte, dimensionner. C'est la bonne chaîne.
> Mais un outil de conseil ne doit pas seulement "compter" : il doit "expliquer".
> Et sur plusieurs points, l'outil simplifie le système réel d'une manière que
> le chef d'exploitation va contester à la première réunion. »_

## 1.1 Ce que le modèle fait bien

1. **La chaîne métier est complète et dans le bon ordre** : assolement →
   production (fourrages, pâture, paille) → distribution par lots → compte des
   stocks → dimensionnement. C'est exactement la logique d'un bilan fourrager.
2. **La périodicité 13 × 28 jours** est le bon découpage fourrager (mois
   fourrager), pas le mois civil.
3. **La distinction pâture / fourrage stocké / concentré / paille** est
   présente, avec deux sorties pour la paille (alimentation / logement) —
   c'est ce qu'on attend d'un bilan moderne.
4. **L'UGB comme clé de voûte** du dimensionnement est la bonne unité : elle
   permet de comparer des systèmes hétérogènes.
5. **L'ordre de priorité de nourrissage** de la pâture (lot 1 prend sa part,
   les suivants se partagent le reste) est un vrai mécanisme de réalisme.
6. **Le taux de refus** appliqué en surcroît de consommation est une
   simplification honnête des pertes de distribution.

## 1.2 Ce que le modèle simplifie (et ce que le conseiller devra assumer)

C'est le cœur de la revue. Chaque point est une **simplification qui change la
lecture du bilan**.

### A1 — Le modèle est en **quantités**, pas en **valeur nutritive** (point majeur)

Le modèle suit la **masse** (tMS, kgMS/animal/j), pas la **valeur nutritive**.
Conséquences :

- **La production d'ensilage est comptée en tMS brutes**, sans taux de récolte
  ni perte d'ensilage. Un ensilage de maïs perd 15–20 % de MS entre la
  production théorique et la consommation effective. Le modèle le compte
  quand même → **survalorisation de la production** et donc du coût.
- **La valeur nutritive de la pâture** est une moyenne pondérée par la
  production (`UFL_pâture = Σ part × UFL_type`), **sans variation saisonnière**.
  En réalité, l'UFL d'une prairie passe de 11 à 7 selon la date de coupe.
  Le modèle utilise **la même valeur toute l'année** → la couverture
  énergétique en pâturage est **biaisée**.
- **Aucune notion de qualité fourragère par stock** : un ensilage d'herbe de
  9,5 UFL et un ensilage d'herbe de 7,5 UFL sont traités pareil s'ils
  portent le même code `EH`. Or c'est **LA** distinction qui fait la
  différence entre un système performant et un système qui s'effondre en
  hiver.
- **Le stock final n'est pas valorisé en valeur nutritive** : on sait qu'il
  reste 200 tMS de foin, pas si c'est du foin de bonne ou de mauvaise
  qualité.

> **Verdict** : le modèle est un **bilan de masse**, pas un **bilan
> nutritionnel**. Pour un outil de conseil, c'est acceptable en première
> approche, mais il faut **le dire** et **montrer les fourchettes**
> (ex. « couverture énergétique : 95–110 % selon la qualité de l'ensilage »).

### A2 — La **capacité d'ingestion (CI)** est fixe par profil, pas liée à la ration

La CI est un **paramètre du profil animal** (UE/animal/j). Le modèle la
considère comme **donnée**, pas comme une **résultat** de la ration. Or en
réalité :

- La CI **dépend de la qualité de la ration** (une ration pauvre en fibres
  et riche en énergie fait baisser la CI).
- La CI **dépend de l'âge, de la production laitière, de la lactation**.
- Le modèle **ne modélise pas** la relation ration → CI : c'est le
  **profils qui dicte la CI**, pas la ration.

> **Conséquence** : si l'utilisateur change la ration, la CI ne change pas →
> le modèle peut dire « couverture 100 % » alors qu'en réalité l'animal
> ingère moins (CI limitée par la ration). C'est un **biais optimiste**.

### A3 — La **production laitière** est un paramètre, pas un résultat

`milk_product_kg` est saisi dans le profil. Le modèle ne calcule **pas** la
production à partir de la ration (pas de modèle de conversion
énergie → lait). Conséquence :

- Le coût / 1000 L est un indicateur **ex post** (coût ÷ production saisie),
  pas un indicateur **ex ante** (si je change la ration, la production
  change).
- Pour un outil de conseil, c'est **un handicap majeur** : le conseiller
  veut savoir « si je change l'assolement, qu'est-ce qui arrive à ma
  production ? » Le modèle ne peut pas répondre.

> **Verdict** : c'est **le point central** si le Rami est un **outil de
> simulation**. La mission du Rami est de **simuler** un système fourrager :
> estimer la faisabilité d'un projet, l'impact des différents climats, les
> leviers mobilisables et leurs impacts. Or actuellement, le Rami est un
> **outil de contrôle** (le système est-il cohérent tel quel ?), pas un
> **outil de simulation** (que se passe-t-il si je change X ?). Pour remplir
> sa mission, il faut que **la production laitière (et les autres sorties du
> système) deviennent des résultats** de la simulation, pas des paramètres de
> saisie. C'est la **condition sine qua non** pour simuler l'impact d'un
> changement d'assolement, d'un climat, ou d'un levier.

### A4 — Le **troupeau est statique** sur l'année

Les lots ont une **présence** (nb × jours) par période, mais :

- **Pas de renouvellement** (pas de vêlage, pas de mort, pas de vente
  intermédiaire).
- **Pas de relation entre lots** (les génisses ne deviennent pas des VL en
  cours d'année).
- **Pas de saisonnalité de production laitière** (la production est la même
  en janvier et en juin).

> **Conséquence** : le modèle est un **instantané**, pas une **dynamique**.
> Pour un **bilan annuel**, c'est acceptable ; pour un **outil de
> simulation** (la mission du Rami), c'est **insuffisant** : on ne peut pas
> simuler l'impact d'un changement de structure du troupeau (ex. « que
> se passe-t-il si j'arrête de garder des génisses ? ») sans une dynamique
> de renouvellement. **À intégrer à la roadmap P3 (M5).**

### A5 — La **pâture** est traitée de manière **binaire** (disponible / pas

disponible)

- La production de pâture est **totale** par période (`kgMS/ha/j × surface ×
jours`), sans **front** (pas de distinction entre pâture « verte » et
  pâture « reportée » en quantité — seulement en valeur nutritive).
- **Pas de notion de front de pâture** : le modèle ne modélise pas le fait
  qu'une prairie se divise en cases et se pâtre de l'intérieur vers
  l'extérieur (ou l'inverse).
- **Pas de pâturage tournant** : la répartition entre lots est par
  **priorité**, pas par **rotation**.
- **La production de pâture n'est pas bornée par la consommation** : si la
  production dépasse la conso, l'excédent est **reporté** (× 0,92) mais
  **pas valorisé ailleurs** (pas de stock, pas de vente).

> **Conséquence** : le modèle est un **bilan de pâture**, pas un **pilotage
> du pâturage**. Pour un conseiller qui accompagne une transition vers le
> pâturage tournant, c'est insuffisant.

### A6 — Les **coûts** sont en **saisie libre**, pas en **référentiel**

- Les `purchaseCost`, `costOfSell`, `productionCost` sont **saisis à la main**
  par l'utilisateur.
- **Pas de valeurs par défaut** : un conseiller n'a pas toujours les prix
  sous la main.
- **Pas de distinction entre coût de revient et valeur de marché** : le
  `productionCost` peut être un coût de revient (charges) ou une valeur de
  marché (prix du foin) — le modèle ne le précise pas.
- **La paille est exclue du KPI total** (cf. bilan-expert-review.md C6).

> **Conséquence** : le bilan est **aussi fiable que la saisie**. Sans
> référentiel de prix, deux conseillers sur la même ferme obtiendront deux
> bilans différents.

### A7 — La **modération VL** est appliquée avec `potential = 1` en dur

Les modérateurs (0,1582 × potentiel + 0,8392, etc.) sont calculés avec
`potential = 1` partout (cf. `mixins.js` L211, L359, L448, L482, L669, L721).
La synthèse agronomique dit « le potentiel de valorisation de la prairie
est fixé à 1 » — c'est **documenté**, mais :

- **Le paramètre n'est pas saisissable** : le conseiller ne peut pas dire
  « sur ma ferme, le potentiel de valorisation est de 0,8 ».
- **La modération n'est appliquée qu'aux VL** : les VV, GEN ne sont pas
  modérés. Or la modération par le pâturage concerne **tous les animaux en
  pâturage**, pas seulement les VL.

> **Conséquence** : la modération est un **artefact du tableur de référence**
> qui n'est plus adapté à l'outil. À clarifier avec INRAE (lié au ticket 14).

### A8 — Le **refus** est un taux unique, pas par stock

`refusalRate` est **global** (un % unique pour tous les fourrages). En
réalité :

- Le refus dépend du **type de fourrage** (ensilage de maïs : 2–5 %, foin :
  5–10 %, ensilage d'herbe : 5–8 %).
- Le refus dépend du **système de distribution** (auge, distributeur,
  râtelier).
- Le refus dépend de la **qualité** (un mauvais fourrage fait plus de refus).

> **Conséquence** : le refus global est une **simplification acceptable**,
> mais à **documenter** (ex. « taux de refus : 5 % (moyenne nationale, à
> ajuster selon le système de distribution »).

### A9 — Le **stock initial** est valorisé au coût de production de **cette**

année

Le stock initial (1er janvier) est compté au `productionCost` de **cette**
année, alors que c'est du stock de **l'année précédente**. Conséquence :

- Si le prix du foin a augmenté de 20 % cette année, le stock initial est
  **survalorisé** dans le bilan.
- Le conseiller attendrait une **saisie du coût du stock initial** (en €).

### A10 — **Pas de notion de « marge » ou de « zone de confort »**

Le modèle donne des **valeurs ponctuelles** (E7 = 1,2 ; couverture = 98 %).
Il ne dit pas **si c'est bon ou mauvais** :

- **Pas de fourchettes de référence** (ex. « E7 entre 0,8 et 1,5 = zone de
  confort »).
- **Pas d'alertes** (ex. « couverture < 90 % = ration insuffisante »).
- **Pas de comparaison** avec des systèmes de référence (ex. « votre coût /
  VL est de 1 200 €, la moyenne régionale est de 1 050 € »).

> **Conséquence** : le modèle **affiche**, il ne **diagnostique** pas. C'est
> **LA** différence entre un outil de saisie et un outil de conseil.

## 1.3 Ce qui manque pour un usage de simulation (priorités)

> **Rappel de la mission** : le Rami est un **outil de simulation** — il doit
> estimer la **faisabilité d'un projet**, l'**impact des différents climats**
> sur l'exploitation, les **leviers mobilisables** et leurs **impacts** sur
> un système fourrager. Le tableau ci-dessous est priorisé pour cette
> mission.

| #       | Manque                                                                           | Impact                                                                        | Effort |
| ------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| **M1**  | **Diagnostic** : alertes + fourchettes de référence                              | **Majeur** — passe de « affichage » à « conseil »                             | 3 j    |
| **M2**  | **Qualité fourragère** : UFL/PDI par stock (pas seulement par type de ration)    | **Majeur** — la qualité fait la différence en hiver                           | 2 j    |
| **M3**  | **Taux de récolte** : séparer production / récolte / conso                       | **Majeur** — le coût de production est faussé sans                            | 2 j    |
| **M4**  | **Référentiel de prix** : valeurs par défaut par code de stock                   | **Important** — fiabilité du bilan                                            | 1 j    |
| **M5**  | **Dynamique du troupeau** : renouvellement, vêlage, production saisonnière       | **Majeur** — **indispensable pour simuler** les changements de structure      | 5 j    |
| **M6**  | **Pâturage** : front, rotation, pâturage tournant                                | **Important** — pour simuler les transitions                                  | 5 j    |
| **M7**  | **Comparaison de scénarios** : deux assolements côte à côte                      | **Majeur** — **le cœur de la simulation** (« et si »)                         | 3 j    |
| **M8**  | **Export Excel au format du tableur de référence**                               | **Important** — interopérabilité                                              | 2 j    |
| **M9**  | **Page des hypothèses** : lister les hypothèses du modèle                        | **Moyen** — confiance du conseiller                                           | 0,5 j  |
| **M10** | **Production laitière comme résultat** : modèle de conversion énergie → lait     | **Majeur** — **condition sine qua non** pour simuler l'impact d'un changement | 5 j    |
| **M11** | **Leviers de simulation** : assolement, climat, ration, structure troupeau, prix | **Majeur** — **l'objet même du Rami**                                         | 5 j    |

> **Total** : ~35,5 j pour transformer le Rami d'un **outil de saisie et de
> contrôle** en un **vrai outil de simulation** (faisabilité, climats, leviers).

## 1.4 La ligne de conduite (agronome)

**Le Rami est un outil de simulation** — sa mission est d'estimer la
**faisabilité d'un projet**, l'**impact des différents climats**, les
**leviers mobilisables** et leurs **impacts** sur un système fourrager.

Aujourd'hui, le Rami répond à _« est-ce que mon système est cohérent tel
quel ? »_ (un bilan). Il ne répond **pas encore** à la question de sa
mission : _« que se passe-t-il si je change X ? »_. Le fossé entre les deux
est mesuré par les points A2, A3, A4 (CI fixe, production laitière
paramètre, troupeau statique) et par les manques M5, M7, M10, M11.

**Recommandation** :

1. **Stabiliser le bilan** (Phase 1 de la roadmap) : sans un bilan fiable,
   aucune simulation n'est crédible.
2. **Ajouter la dimension simulation** (Phase 3) :
   - **M10** (production laitière comme résultat) — **condition sine
     qua non** : sans ça, on ne peut pas simuler l'impact d'un changement
     de ration ou d'assolement sur la production.
   - **M11** (leviers de simulation) — **l'objet même du Rami** : l'utilisateur
     doit pouvoir modifier l'assolement, le climat, la ration, la structure
     du troupeau, les prix, et voir l'impact sur les indicateurs clés
     (production, coût, autonomie, marge).
   - **M5** (dynamique du troupeau) — pour simuler les changements de
     structure (ex. « que se passe-t-il si j'arrête de garder des
     génisses ? »).
   - **M7** (comparaison de scénarios) — pour comparer « avant / après »
     un changement, ou deux options côte à côte.
3. **Rendre explicites les simplifications** (M9) : page des hypothèses,
   fourchettes, alertes. C'est le meilleur rapport qualité / effort pour
   que le conseiller puisse **interpréter** les résultats de la simulation.

---

# Partie 2 — Regard technique (ingénieur logiciel)

> _« Le code est lisible, les formules sont commentées (cellules Excel en
> commentaire, c'est précieux), et l'architecture est simple (Vue 2 + Vuex,
> quasi stateless côté serveur). Mais il y a des patterns de code qui vont
> coûter cher à la maintenance, et des bugs latents qui attendent leur
> heure. »_

## 2.1 Ce qui est solide (techniquement)

1. **L'architecture est simple et compréhensible** : Vue 2 + Vuex, 14
   modules de store, un fichier `mixins.js` central pour les calculs, un
   `workspace.json` pour la persistance. Pas de microservices, pas de
   base de données complexe — c'est **maintenable**.
2. **Les formules sont commentées** : chaque fonction porte la référence
   Excel du tableur de référence (`H233`, `E6`, `Y648`…). C'est **précieux**
   pour la traçabilité et la vérification.
3. **Les tests unitaires existent** : 7 spec files, ~62 tests (`farm`,
   `herd`, `referential`, `report`, `stock`, `straw`, `workspace`). C'est un
   **socle** — insuffisant, mais un socle.
4. **La séparation des rôles est claire** : `mixins.js` (calculs purs),
   `report.js` (getters de bilan), `barn.js` (stocks), `farm.js`
   (production), `herd.js` (troupeau). C'est **propre**.
5. **La persistance est simple** : `workspace.json` local, pas de backend
   complexe. C'est un **choix architectural** qui simplifie tout.
6. **Le code des tickets est tracé** : chaque ticket a une doc d'analyse,
   l'INDEX est à jour. C'est **rare** et précieux.

## 2.2 Les patterns de code qui vont coûter cher

### T1 — `mixins.js` est un **god object** de 1 380 lignes

Tous les calculs sont dans **un seul fichier**. Conséquences :

- **Difficile à tester** : les fonctions sont entrelacées (ex.
  `getV647` appelle `getTotalConsumptionExcludingConcentrates` qui appelle
  `getTotalPastureConsumption` qui appelle `getGreenPastureConsumption` qui
  appelle `getMaxConsumptionGreenPasture` qui appelle
  `getAvailableGreenPastureByAnimal` — **5 niveaux de récursivité**).
- **Difficile à refactorer** : une modification dans une fonction peut
  impacter 10 autres sans qu'on le voie.
- **Pas de séparation par domaine** : les calculs de pâture, de coûts, de
  dimensionnement sont mélangés.

> **Recommandation** : splitter `mixins.js` en modules par domaine
> (`pasture.js`, `costs.js`, `dimensioning.js`, `herd.js`). Effort : ~2 j.
> Impact : **majeur** sur la maintenabilité.

### T2 — Les **caches** sont des objets globaux, pas invalidés

- `excessPastureCache` (L175) et `greenPastureConsumptionCache` (L259) sont
  des **objets JavaScript globaux** dans `mixins.js`.
- Ils sont **jamais invalidés** : si l'utilisateur change la simulation,
  les caches **persistent**.
- La clé du cache est `${batch.id}-${period}` — mais `batch.id` est **volatil**
  (cf. architecture : les ids custom sont dérivés à la volée par `mergeLists`).
  Donc le cache est **invalide dès que l'utilisateur modifie un lot**.

> **Boulet** : les résultats affichés peuvent être **stale** (anciens).
> **Recommandation** : soit supprimer les caches (les calculs ne sont pas
> si coûteux), soit les invalider à chaque `applyToSimulation`. Effort :
> 0,5 j. Impact : **majeur** sur la confiance des résultats.

### T3 — Les **`stockCodeList` en dur** sont répandues

`['FH','EH','EM','EL','FL']` est écrit **en dur** dans de nombreux getters
(`report.js` L220, L272, L372 ; `mixins.js` L1013, L1026, L1056…).
Conséquences :

- **Ajouter un stock** (ex. `RT` pour les tourteaux — ticket 12) = modifier
  **5–6 endroits** sans qu'on le voie.
- **Risque de divergence** : `getStockEvolution` suit aussi `AS` et `STRAW`,
  mais les autres getters non → incohérence.

> **Recommandation** : dériver la liste du référentiel (`barnStockItems`),
> pas en dur. Effort : 1 j. Impact : **important**.

### T4 — Les **getters du store** calculent à la volée, pas en cache

Les getters `getClassicFeedsStock`, `getStrawStock`, `getDimensioning`, etc.
**recalculent** à chaque accès (pas de cache). Conséquences :

- **Performance** : pour une simulation de 50 lots × 13 périodes, le
  recalcul à chaque re-render est **coûteux**.
- **Cohérence** : si deux getters calculent la même chose (ex. `getV647`
  appelé par `getUGBSystem` et par `getHarvestedFodder`), ils peuvent
  **diverger** si l'état change entre les deux appels.

> **Recommandation** : calculer les valeurs dérivées **une fois** (dans une
> action `dispatchProduction` / `applyToSimulation`) et les stocker dans le
> state, pas les recalculer dans les getters. Effort : 3 j. Impact :
> **important** (performance + cohérence).

### T5 — Les **formules sont dupliquées** entre `mixins.js` et `StockTable.vue`

- Le `totalCost` est calculé **dans le composant** (`StockTable.vue`
  `totalCost()`, L173) **et** dans `mixins.js` (`getCostIndicator`, L753).
- Les deux formules **ne sont pas identiques** (cf. bilan-expert-review.md
  C7 : `totalCost` Vue ajoute `vente × costOfSell` pour les concentrés,
  `getCostIndicator` ne le fait pas).

> **Boulet** : deux sources de vérité pour le même calcul → divergence.
> **Recommandation** : un seul endroit (le store), le composant consomme.
> Effort : 0,5 j. Impact : **important**.

### T6 — Les **unités** sont mélangées sans conversion explicite

- Fourrages en **tMS**, concentrés en **qtx**, paille en **tonnes**, pâture
  en **kgMS/ha/j**.
- Les conversions (`/1000`, `/100`) sont **éparpillées** dans les formules
  sans commentaire explicite.
- **Risque** : une erreur de conversion (ex. `/100` au lieu de `/1000`)
  passe inaperçue.

> **Recommandation** : un module `units.js` avec des fonctions de conversion
> nommées (`kgToT`, `tmsToQtx`, etc.), et des commentaires explicites.
> Effort : 1 j. Impact : **moyen**.

### T7 — Les **`replaceNan`** masquent les erreurs

`replaceNan(value, 0)` est utilisé **partout** (ex. `report.js` L81–L228).
Conséquence :

- Une **division par zéro** (ex. couverture avec 100 % de pâture — ticket 10)
  est **silencieusement remplacée par 0** au lieu d'être signalée.
- Le conseiller voit « 0 % » au lieu de « erreur de calcul ».

> **Recommandation** : distinguer « valeur nulle » (0) de « valeur
> invalide » (NaN) — afficher « — » ou « N/A » pour les NaN, pas « 0 ».
> Effort : 1 j. Impact : **important** (confiance).

### T8 — Les **try/catch** avalent les erreurs

`getDimensioning` (`report.js` L275–L332) est entouré d'un
`try/catch` qui **retourne les valeurs par défaut** (0) en cas d'erreur,
sans log ni alerte. Conséquence :

- Une erreur de calcul est **silencieuse** : le conseiller voit des 0
  sans savoir pourquoi.
- **Difficile à déboguer** en production.

> **Recommandation** : logger l'erreur (`console.error`) et afficher un
> avertissement dans l'UI (« Erreur de calcul : vérifiez les données »).
> Effort : 0,5 j. Impact : **important**.

### T9 — Les **`period + 1`** et `period.id - 1` sont des **off-by-one**

chroniques

- `getTotalConsumptionExcludingConcentrates` (L899) : `getBatchConsumption(batch, period + 1, code)` —
  le `period + 1` est un **offset** pour passer de l'index (0-based) à
  l'id de période (1-based).
- `getConsumptionByBarnStockItemByPeriod` (L703) : `batch.housing.presence[periodId - 1].animalCount` —
  l'inverse.
- **Risque** : un off-by-one est **très difficile à détecter** (le
  résultat est faux de une période, pas de 0).

> **Recommandation** : un wrapper `getPeriodById(indexOrId)` qui gère la
> conversion, et des tests dédiés sur les bords (période 1 et 13). Effort :
> 1 j. Impact : **important**.

### T10 — Les **tests** couvrent peu de cas limites

~62 tests pour 3 300 lignes de code, c'est **peu**. Les tests existants
couvrent les cas **nominatifs**, pas les **cas limites** :

- **Pas de test** sur la couverture avec 100 % de pâture (ticket 10).
- **Pas de test** sur la paille avec 0 production (cas de la Grange vide).
- **Pas de test** sur le dimensionnement avec 0 rotation.
- **Pas de test** sur les off-by-one (T9).

> **Recommandation** : ajouter des tests de **propriété** (ex. « le stock
> final est toujours ≥ 0 si le stock initial est ≥ 0 et la conso ≤ la
> production ») et des tests sur les **bords** (0, 1, 13). Effort : 3 j.
> Impact : **important**.

## 2.3 Les bugs latents (à corriger ou à justifier)

| #       | Bug                                                                                                                                                                                                             | Lieu                        | Impact         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------- |
| **T11** | `getStockNcoastData` mapé mais inexistant (cf. bilan-expert-review.md C1)                                                                                                                                       | `Report.vue` L79            | **Bloquant**   |
| **T12** | `item.total` jamais rempli côté store (cf. bilan-expert-review.md C2)                                                                                                                                           | `report.js` L90/121/155/194 | **Bloquant**   |
| **T13** | `tms` / `milleLitre` « avec » = mélange d'unités (cf. bilan-expert-review.md C5)                                                                                                                                | `mixins.js` L832/835        | **Bloquant**   |
| **T14** | `totalCost` concentrés : `vente` ajouté au lieu de déduit (cf. bilan-expert-review.md C7)                                                                                                                       | `StockTable.vue` L187-189   | **Important**  |
| **T15** | `getPastureConsumptionTotal` : × 28 global vs dans la somme (cf. bilan-expert-review.md C11)                                                                                                                    | `mixins.js` L601-611        | **Important**  |
| **T16** | `getHerdNeeds` : `potential = 1` en dur, modération inactive (cf. bilan-expert-review.md C12)                                                                                                                   | `mixins.js` L960            | **Moyen**      |
| **T17** | `chargePotentiel` arrondi à l'entier (cf. bilan-expert-review.md C13)                                                                                                                                           | `report.js` L309            | **Moyen**      |
| **T18** | Caches globaux jamais invalidés (T2)                                                                                                                                                                            | `mixins.js` L175, L259      | **Majeur**     |
| **T19** | `getFinalStockByBarnStockItem` : `if/else` fait deux fois pareil (STRAW = autres)                                                                                                                               | `mixins.js` L614-628        | **Cosmétique** |
| **T20** | `calculateTotalUE` : si les proportions ne font pas 100 %, un « EIP » (écart d'ingestion potentiel) est injecté avec **toutes les valeurs nutritionnelles = 1** — c'est un **alimart** qui fausse le `besoinMS` | `mixins.js` L23-44          | **Important**  |

> **T20 en détail** : si l'utilisateur saisit une ration à 80 % (ex. 50 %
> ensilage + 30 % foin), le modèle injecte 20 % d'« EIP » avec UEL=1, UFL=1,
> PDIinf=1… → le `UE_ration` est **faussé** (l'EIP a une valeur UE de 1,
> pas la valeur UE d'un aliment réel) → le `besoinMS` est **sous-estimé** →
> la consommation est **sous-estimée** → le stock final est **sur-estimé**.
> **C'est un biais systémique** sur toutes les rations à < 100 %.

## 2.4 La dette technique (synthèse)

| Catégorie        | Dette                                                       | Effort | Impact        |
| ---------------- | ----------------------------------------------------------- | ------ | ------------- |
| **Architecture** | Split `mixins.js` en modules par domaine (T1)               | 2 j    | **Majeur**    |
| **Architecture** | Dériver `stockCodeList` du référentiel (T3)                 | 1 j    | **Important** |
| **Architecture** | Calculer les valeurs dérivées une fois, pas à la volée (T4) | 3 j    | **Important** |
| **Cohérence**    | Un seul endroit pour le `totalCost` (T5)                    | 0,5 j  | **Important** |
| **Cohérence**    | Module `units.js` pour les conversions (T6)                 | 1 j    | **Moyen**     |
| **Robustesse**   | Distinguer NaN de 0 (T7)                                    | 1 j    | **Important** |
| **Robustesse**   | Logger les erreurs, pas les avaler (T8)                     | 0,5 j  | **Important** |
| **Robustesse**   | Wrapper `getPeriodById` pour les off-by-one (T9)            | 1 j    | **Important** |
| **Tests**        | Tests de propriété + cas limites (T10)                      | 3 j    | **Important** |
| **Bugs**         | T11–T20 (cf. bilan-expert-review.md pour T11–T17)           | 3 j    | **Majeur**    |
| **Performance**  | Invalider les caches (T2)                                   | 0,5 j  | **Majeur**    |

> **Total** : ~17,5 j pour **stabiliser** le code (bugs + robustesse) et
> **réduire la dette** (architecture + tests).

---

# 3. Roadmap priorisée globale

## 3.1 Les 3 piliers

Le Rami est un **outil de simulation** (faisabilité, climats, leviers). Il a
**trois piliers** à consolider, dans cet ordre :

1. **Faire confiance** (P1) : corriger les bugs qui faussent les résultats —
   sans un bilan fiable, aucune simulation n'est crédible.
2. **Maintenir** (P2) : réduire la dette technique pour que les
   modifications futures ne cassent pas.
3. **Simuler** (P3) : passer de « outil de contrôle » à « outil de
   simulation » — c'est **la mission du Rami**.

## 3.2 Le plan (en jours)

### Phase 1 — Faire confiance (P1) — ~8 j

| #   | Action                                                                             | Volet | Effort |
| --- | ---------------------------------------------------------------------------------- | ----- | ------ |
| 1   | T11–T13 : corriger les bugs bloquants du Bilan (cf. bilan-expert-review.md A1–A2)  | T     | 2 j    |
| 2   | T14–T17 : corriger les bugs importants du Bilan (cf. bilan-expert-review.md A3–B4) | T     | 1,5 j  |
| 3   | T20 : corriger l'EIP (écart d'ingestion potentiel) qui fausse le besoinMS          | T     | 1 j    |
| 4   | T18 : invalider les caches globaux                                                 | T     | 0,5 j  |
| 5   | T15 : vérifier `getPastureConsumptionTotal` (off-by-one du × 28)                   | T     | 0,5 j  |
| 6   | M3 : taux de récolte (séparer production / récolte / conso)                        | A     | 2 j    |
| 7   | M4 : référentiel de prix (valeurs par défaut par code de stock)                    | A     | 1 j    |

### Phase 2 — Maintenir (P2) — ~10 j

| #   | Action                                                      | Volet | Effort |
| --- | ----------------------------------------------------------- | ----- | ------ |
| 8   | T1 : split `mixins.js` en modules par domaine               | T     | 2 j    |
| 9   | T4 : calculer les valeurs dérivées une fois, pas à la volée | T     | 3 j    |
| 10  | T3 : dériver `stockCodeList` du référentiel                 | T     | 1 j    |
| 11  | T5 : un seul endroit pour le `totalCost`                    | T     | 0,5 j  |
| 12  | T7 + T8 : NaN ≠ 0, logger les erreurs                       | T     | 1,5 j  |
| 13  | T9 : wrapper `getPeriodById` + tests sur les bords          | T     | 1 j    |
| 14  | T10 : tests de propriété + cas limites                      | T     | 1 j    |

### Phase 3 — Simuler (P3) — ~20,5 j

| #   | Action                                                                   | Volet | Effort |
| --- | ------------------------------------------------------------------------ | ----- | ------ |
| 15  | M10 : production laitière comme résultat (modèle énergie → lait)         | A     | 5 j    |
| 16  | M11 : leviers de simulation (assolement, climat, ration, troupeau, prix) | A     | 5 j    |
| 17  | M5 : dynamique du troupeau (renouvellement, vêlage)                      | A     | 5 j    |
| 18  | M7 : comparaison de scénarios (deux assolements côte à côte)             | A     | 3 j    |
| 19  | M1 : diagnostic (alertes + fourchettes de référence)                     | A     | 3 j    |
| 20  | M2 : qualité fourragère (UFL/PDI par stock)                              | A     | 2 j    |
| 21  | M8 : export Excel au format du tableur de référence                      | A     | 2 j    |
| 22  | M9 : page des hypothèses                                                 | A     | 0,5 j  |

> **Total** : ~38,5 j pour les 3 phases.
> **Priorité absolue** : **Phase 1** (Faire confiance) — sans ça, les
> résultats ne sont pas fiables et aucune simulation n'est crédible.
> **Cœur de la mission** : **Phase 3** (Simuler) — M10, M11, M5, M7 sont
> **les** fonctionnalités qui font du Rami un outil de simulation.

## 3.3 Ce qu'il faut **trancher** avant de coder

| #      | Décision                                                                                             | Impact                                                         | Qui décide                 |
| ------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------- |
| **D1** | Ticket 12 : tourteaux — Option 1 (`RP`) ou Option 2 (`RT`) ?                                         | **Majeur** — impacte la traçabilité des concentrés             | INRAE + équipe             |
| **D2** | Ticket 14 : valeurs des pâtures VL/VA — déclinées ou non ?                                           | **Important** — impacte la couverture en pâturage              | INRAE                      |
| **D3** | Le `potential` de la modération VL est-il saisissable ou fixe à 1 ?                                  | **Moyen** — impacte les besoins des VL                         | INRAE                      |
| **D4** | Le stock initial est-il valorisé au coût de production de l'année ou au coût de l'année précédente ? | **Moyen** — impacte le coût du bilan                           | Conseiller                 |
| **D5** | **Tranché** : le Rami est un outil de **simulation** (faisabilité, climats, leviers).                | **Majeur** — la Phase 3 (M10, M11, M5, M7) est **prioritaire** | Product owner              |
| **D6** | Quel modèle de conversion **énergie → lait** pour M10 ? (INRAE, Lactan4, modèle simplifié ?)         | **Majeur** — impacte la crédibilité de la simulation           | INRAE + équipe             |
| **D7** | Quels **leviers** pour M11 ? (assolement, climat, ration, structure troupeau, prix, taux de refus ?) | **Majeur** — l'objet même du Rami                              | Product owner + conseiller |

> **D5 est tranché** : le Rami est un outil de simulation. Les décisions
> **D6** et **D7** sont les suivantes à trancher : elles déterminent le
> périmètre exact de la Phase 3.

---

## 4. Références internes

- Formules du modèle : [synthese-exploitation-simulee.md](synthese-exploitation-simulee.md)
- Fond agronomique : [synthese-agronomique.md](synthese-agronomique.md)
- Traçabilité par item : [cycle-de-vie-des-items.md](cycle-de-vie-des-items.md)
- Revue détaillée du Bilan : [bilan-expert-review.md](bilan-expert-review.md)
- Tickets : [tickets/INDEX.md](../projet/tickets/INDEX.md)
- Code :
  - `services/frontend/ui/src/store/modules/mixins.js` (1 380 lignes, god object)
  - `services/frontend/ui/src/store/modules/report.js` (getters de bilan)
  - `services/frontend/ui/src/store/modules/barn.js` (stocks)
  - `services/frontend/ui/src/store/modules/farm.js` (production)
  - `services/frontend/ui/src/store/modules/herd.js` (troupeau)
  - `services/frontend/ui/src/components/parts/barn/StockTable.vue` (table + coûts)
  - `services/frontend/ui/tests/unit/vuex/*.spec.js` (~62 tests)
