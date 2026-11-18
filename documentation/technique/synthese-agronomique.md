# Le Rami — Synthèse agronomique d'une exploitation fourragère simulée

> **État des lieux** — synthèse agronomique de ce que le système **modélise
> actuellement**. Version **agronome** de la synthèse de l'exploitation simulée
> ([synthese-exploitation-simulee.md](synthese-exploitation-simulee.md) en est la
> version technique, centrée sur l'implémentation).
>
> **Date de mise à jour : 2026-11-18.**
>
> **Lecture** : ce document décrit le **cycle fourrager annuel** d'une exploitation
> laitière tel que le modèle le représente **aujourd'hui** — les hypothèses
> agronomiques, les formules de besoins nutritionnels, de production et de
> dimensionnement, et la logique de bilan des stocks. **Aucun détail
> informatique** : uniquement le fond agronomique et les calculs. Les limites
> connues et évolutions en cours sont suivies dans les tickets
> ([../projet/tickets/INDEX.md](../projet/tickets/INDEX.md)) et ne figurent pas ici.
>
> **Conventions d'unités** : la matière sèche (MS) est exprimée en **tMS** pour les
> fourrages, en **kgMS/animal/j** pour les besoins, en **qtx** pour les
> céréales/protéagineux, en **tonnes** pour la paille.
>
> **Repères Excel** : les formules renvoient aux cellules du tableur de référence
> INRAE (commentaires `H233`, `E6`–`E9`, `Y648`…) d'où elles sont issues.

---

## 1. Ce que modélise le système

Le Rami simule **l'autonomie fourragère annuelle** d'une exploitation laitière,
c'est-à-dire la chaîne complète :

```
assolement ──▶ production de fourrages & de pâture ──▶ distribution aux lots
   ──▶ bilan des stocks et des coûts ──▶ dimensionnement (chargement, autonomie)
```

L'année est découpée en **13 périodes de 28 jours** (≈ 1 mois fourrager). Tous les
flux sont calculés **période par période**, puis agrégés sur l'année. C'est le
découpage du tableur de référence : chaque mois fourrager est une colonne du
bilan.

Le **système simulé** se compose de :

| Bloc                 | Objet agronomique                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **La Ferme**         | l'assolement : surfaces, cultures fourragères, productions par mois                                                         |
| **La Grange**        | les stocks : fourrages récoltés, céréales, paille ; pertes, achats, ventes                                                  |
| **Le Troupeau**      | les lots (vaches laitières, vaches en vêlage, génisses…), leurs rations                                                     |
| **Le Bilan**         | le compte des stocks et des coûts, et le dimensionnement du système                                                         |
| **Les Référentiels** | les bases agronomiques : baguettes (cultures), valeurs des aliments, profils animaux, types de logement, années climatiques |

### 1.1 La clé de voûte : l'UGB

Tout le dimensionnement s'exprime en **UGB (unité de gros bétail)**. Par
convention, **1 UGB = 4,75 tMS de matière sèche ingérée par an**. C'est le facteur
de conversion entre la matière sèche fournie et la capacité de l'exploitation à
nourrir du bétail :

- un troupeau de X UGB consomme 4,75 × X tMS/an ;
- une prairie de rendement Y tMS/ha peut nourrir Y/4,75 UGB/ha/an (à l'état brut).

### 1.2 Les données agronomiques de base (référentiels)

| Donnée                          | Contenu agronomique                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Baguettes fourragères**       | une « baguette » = une culture fourragère décrite mois par mois : sa **production** (pâture en kgMS/ha/j, fourrage récolté en tMS/ha), la **période de récolte** et le **type de produit** (foin, ensilage d'herbe, ensilage de maïs, grain, pâture…), et son **rendement paille** (kg/ha). Deux déclinaisons : année **normale** et année **sèche** (les rendements sont minorés en année sèche). |
| **Types de ration (fourrages)** | les aliments à distribuer : foin, ensilage d'herbe, ensilage de maïs, ensilage de légumineuse, foin de légumineuse, paille, avalants, et les **cartes rations custom** (déclinaisons locales d'un aliment, ex. « Foin Luzerne Brenne »). Chaque aliment porte **9 valeurs nutritionnelles** : UEL, UEB, UEM, UFL, UFV, PDIinf, PDIN, PDIE, refus.                                                  |
| **Aliments concentrés**         | céréales en grain, protéagineux, tourteaux, concentrés céréales : UFL, UFV, PDIN, PDIE, PDIinf.                                                                                                                                                                                                                                                                                                    |
| **Types de logement**           | aère paillée intégrale, case, stabulation, etc. — chacun avec un **besoin de litière** en **kg de paille / UGB / jour**.                                                                                                                                                                                                                                                                           |
| **Types de pâture**             | pâtures graminées, légumineuses, mélangées — valeurs nutritionnelles (UFL, PDIinf, etc.).                                                                                                                                                                                                                                                                                                          |
| **Profils animaux**             | un profil = type de lot (vaches laitières VL, vaches en vêlage VV, génisses GEN…) avec, par période : **capacité d'ingestion (CI)** en UE/animal/j, besoins en **UFL** et **PDI**, et l'UE et l'UF **considérés** (laquelle valeur UE — Lait, Élevage, Maintien — est retenue pour le calcul).                                                                                                     |
| **Années climatiques**          | normale / sèche — modulent les rendements des baguettes.                                                                                                                                                                                                                                                                                                                                           |

> Le champ qui articule tout le système : chaque aliment (ration ou concentré) est
> **rattaché à un code de stock** (foin `FH`, ensilage d'herbe `EH`, ensilage de
> maïs `EM`, céréales `RC`, protéagineux `RP`, autres `AS`, ensilage de
> légumineuse `EL`, foin de légumineuse `FL`, paille `STRAW`). C'est ce code qui
> permet de remonter la consommation d'un aliment vers le stock d'où il provient,
> et donc de faire le compte des stocks.

---

## 2. La Ferme — assolement et production

### 2.1 Ce que l'on saisit

- **L'assolement** : la liste des cultures (baguettes) avec leurs **surfaces (ha)**,
  et la **SAU** totale de l'exploitation.
- **L'année climatique** (normale ou sèche) : détermine les rendements mobilisés.

### 2.2 La production

**Fourrages récoltés (par type de stock, par mois)** : pour chaque culture et
chaque mois, si la baguette prévoit une récolte (type de produit ≠ pâture), la
production du mois =

```
production (tMS/ha) × surface (ha)
```

somme des cultures qui récoltent le même mois, par type de stock. Les récoltes de
grain (céréales/protéagineux) s'expriment en **qtx/ha** (pas en MS).

**Pâture (par mois)** : pour les cultures en pâturage, la production mensuelle =

```
production (kgMS/ha/j) × surface (ha) × jours du mois
```

La **valeur nutritive de la pâture disponible** est calculée en moyenne pondérée
par la production de chaque prairie :

```
UFL_pâture(période)  = Σ (part de production) × UFL(type de pâture)
PDIinf_pâture(période) = Σ (part de production) × PDIinf(type de pâture)
```

**Paille (à la production des céréales)** :

```
paille produite (t) = Σ [rendement paille (kg/ha) × surface] / 1000
```

seules les cultures (céréales) comptent, pas les prairies.

**Surfaces agronomiques** :

- **SFP** = Surface Fourragère Pâturable (somme des prairies, type `P…`) ;
- **SAU** = somme de toutes les surfaces.

### 2.3 Résultats

- production de fourrages par stock et par mois ;
- production de pâture par mois (quantité + valeur nutritive) ;
- production de paille annuelle.

---

## 3. La Grange — les stocks

### 3.1 Ce que l'on saisit

- **Les stocks au 1er janvier** : pour chaque type de stock (fourrages en tMS,
  céréales/protéagineux en qtx, paille en tonnes).
- **Le taux de refus** (%) : pertes de distribution (rejet, dégradation) appliquées
  aux fourrages.
- **Les coûts** : prix d'achat, prix de vente, coût de production par stock (pour le
  compte des coûts).

### 3.2 Le compte de stock

Pour chaque stock, sur l'année :

```
stock final = stock initial + production − consommation
```

où la **consommation** est celle calculée depuis le troupeau (§4.3) ; pour la
**paille**, la consommation = paille alimentaire **et** paille de litière
additionnées.

**Le déficit = l'achat nécessaire** : si le stock final est négatif, l'exploitation
doit acheter le manque :

```
achat = max(0, −(stock final − stock initial))
```

**La valeur des aliments consommés** (base du coût alimentaire) :

```
valeur = consommation × (1 + refus/100) + achat × prix_achat
       − vente × coût_de_vente + production × coût_de_production
```

> Le **refus** s'applique en surcroît de consommation : 100 kg distribués avec 5 %
> de refus représentent 105 kg sortis du stock.

### 3.3 Résultats

Le tableau **STOCKS ET COUTS** : par stock (fourrages / concentrés / paille), les
colonnes _stock initial | production | consommation | stock final | achat_ et les
coûts associés. Pour la paille, **deux lignes distinctes** — _paille
(alimentation)_ et _paille (logement)_ — avec une ligne de synthèse.

---

## 4. Le Troupeau — lots et rations

### 4.1 Ce que l'on saisit par lot

- **le type de lot** et son **profil animal** (par période : capacité d'ingestion,
  besoins en énergie/protéines) ;
- **le nombre d'animaux** et leur **présence** par période (nombre × jours de
  présence, 0–28 j) — pour les génisses par exemple, la présence varie sur l'année ;
- **le type de logement** (d'où le besoin en litière/paille) ;
- **la ration** : la liste des fourrages avec leurs **proportions (%)** ;
- **les concentrés** : la liste des concentrés avec leur **quantité (kg/animal/j)** ;
- **l'ordre de priorité** de nourrissage (qui mange la pâture en premier).

### 4.2 Les besoins nutritionnels (le cœur du modèle)

Le modèle part de la **capacité d'ingestion (CI)** du profil animal (en UE/animal/j)
et en déduit la **quantité de MS ingérée**, puis les besoins en énergie et en
protéines.

#### 4.2.1 Modération par le potentiel de la prairie

Pour les **vaches laitières (VL)**, les besoins et l'ingestion sont **modérés par
le potentiel de valorisation de la prairie** (ici fixé à 1) :

```
modérateur_MS     = 0,1582 × potentiel + 0,8392    (≈ 0,9974 à potentiel = 1)
modérateur_énergie = 0,5367 × potentiel + 0,4582    (≈ 0,9949)
modérateur_protéines = 0,6431 × potentiel + 0,3522   (≈ 0,9953)
```

Ces modérateurs (issus du tableur de référence) ramènent les besoins théoriques au
niveau réellement réalisable en pâturage. Pour les autres lots (VV, GEN), le
modérateur vaut **1** (pas de modération).

#### 4.2.2 Besoin en matière sèche (H233)

```
UE_ration = Σ (proportion_i / 100) × valeur UE de l'aliment i
besoinMS  = (CI × modérateur_MS) / UE_ration        [kgMS/animal/j]
```

L'**UE de la ration** est la moyenne pondérée des valeurs UE des aliments (la
colonne UE retenue selon le profil : UEL pour le lait, UEB pour l'élevage, UEM
pour le maintien). Si les proportions des fourrages ne s'élèvent pas à 100 %, un
**écart d'ingestion potentiel** complète la ration (l'animal mangerait davantage).

> C'est la formule inverse d'un taux de conversion : l'ingestion de MS est celle
> qui permet d'atteindre la capacité d'ingestion exprimée en UE.

#### 4.2.3 Besoins énergétique et protéique (H234, H235)

```
besoin_énergie = UFL_besoin × modérateur_énergie
besoin_protéines = PDI_besoin × modérateur_protéines
```

### 4.3 La couverture des besoins

La **couverture** compare ce que la ration fournit à ce que l'animal doit ingérer.

**Énergie** :

```
UF_fourni = UF(pâture) + UF(fourrages) [+ UF(concentrés)]
DEF  = UF_fourni / UE_ration          [UF/kgMS de la ration]
DERm = besoin_énergie / (CI × modérateur_MS)   [UF/kgMS nécessaires]
couverture_énergie = DEF / DERm × 100           [%]
```

**Protéines** : idem avec les valeurs PDI :

```
couverture_protéines = DPF / DPRm × 100
```

où `DPF` (pouvoir digestible fourni) et `DPRm` (pouvoir digestible requis) sont les
analogs protéiques de `DEF`/`DERm`.

> Une couverture **> 100 %** : la ration dépasse le besoin (sur-nutrition) ;
> **< 100 %** : ration insuffisante (à compléter en concentrés). C'est le
> graphique **« Couverture des besoins par les fourrages et concentrés »** par
> période.

**Note sur la pâture reportée** : quand la pâture d'un mois excède la consommation,
l'excédent est **reporté** sur le mois suivant. La valeur nutritive de la pâture
reportée est **minorée de 8 %** (facteur **0,92**) — perte de qualité énergétique
entre la production et la valorisation :

```
UF(pâture) = consommation_pâture_courante + consommation_report × 0,92
```

### 4.4 La consommation des stocks (par lot, par mois)

**Fourrages** (en proportion de la ration) :

```
conso_aliment (kgMS/animal/j) = (proportion / 100) × besoinMS
conso_lot (tMS)              = conso_aliment × nb_animaux × jours / 1000
```

la consommation annuelle d'un stock = somme sur les lots et les mois, multipliée
par `(1 + refus/100)`.

**Concentrés** (en quantité) :

```
conso_lot (qtx) = Σ quantity (kg/animal/j) × nb_animaux × jours / 100
```

**Pâture** : la distribution est **bornée à la production** du mois et se fait dans
l'**ordre de priorité** des lots — le lot prioritaire prend sa part de pâture
disponible, les suivants se partagent le reste (si pâture insuffisante, les
fourrages suppléent).

**Paille de litière (logement)** :

```
UGB_lot (j) = (besoinMS × nb_animaux × jours) / 4,75
conso_litière (t) = besoin_litière (kg/UGB/j) × UGB_lot × jours / 1000
```

le besoin de litière dépend du **type de logement** (ex. aère paillée intégrale :
besoin maximal) et de la **présence** effective des animaux.

### 4.5 Résultats

- les rations saisies (proportions, concentrés, présence) ;
- les **couvertures énergétique et protéique** par période (graphique) ;
- la **consommation par stock** (fourrages, concentrés, pâture, paille).

---

## 5. Le Bilan — compte des stocks et dimensionnement

### 5.1 Le tableau STOCKS ET COUTS

Trois groupes de lignes :

| Groupe         | Stocks                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Fourrages**  | foin `FH`, foin de légumineuse `FL`, ensilage d'herbe `EH`, ensilage de maïs `EM`, ensilage de légumineuse `EL`, autres `AS` |
| **Concentrés** | céréales `RC`, protéagineux `RP`                                                                                             |
| **Paille**     | paille (alimentation) + paille (logement) + synthèse                                                                         |

Chaque ligne : _stock initial | production | consommation | stock final | achat_ +
les coûts (achat, vente, production, total).

### 5.2 Les coûts — déclinés par unité de référence

Le coût alimentaire est exprimé **par unité de référence** pour comparer les
systèmes :

| Clé de coût          | Formule                                                 |
| -------------------- | ------------------------------------------------------- |
| **/ ha de SFP**      | coût total / SFP                                        |
| **/ tMS fourragère** | coût total / (production fourragère + pâture consommée) |
| **/ UGB**            | coût total / UGB du système                             |
| **/ vache laitière** | coût total / nombre de VL                               |
| **/ 1000 L de lait** | coût total × 1000 / production de lait des VL           |

Deux variantes : **« sans »** (hors achats/ventes de stocks) et **« avec »**
(achats/ventes inclus). Les **KPI** : coût total (fourrages + concentrés) et
**part des concentrés** dans ce coût (un indicateur de dépendance aux achats).

### 5.3 Le dimensionnement du système (E6–E9, Y648)

Toutes les mesures de chargement reposent sur l'**UGB du système** :

```
UGB_système = Σ périodes [besoinMS × nb_animaux × jours / 1000] / 4,75
```

(soit l'UGB « nourri », la matière sèche réellement ingérée convertie en UGB, hors
concentrés.)

| Indicateur                    | Formule                                                   | Signification agronomique                                          |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| **E6 — Chargement SAU**       | UGB_système / SAU                                         | pression du troupeau sur la surface totale                         |
| **E7 — Chargement apparent**  | UGB_système / SFP                                         | pression sur la seule surface pâturée                              |
| **E8 — Chargement corrigé**   | (UGB_système + (surplus − achat + vente)/UGB) / SFP       | chargement ramené aux stocks effectivement valorisés               |
| **E9 — Chargement potentiel** | (Σ production fourrages + production pâture) / 4,75 / SFP | le chargement maximal que la production du système pourrait porter |

Et les deux indicateurs de synthèse :

- **Autonomie** = `E8 − E7` : > 0 → le système est **autonome** (il valorise plus
  qu'il ne produit en surface pâturée) ;
- **Potentiel réalisé** = `E8 / E9 × 100` : ≥ 90 % → le système exploite son
  **potentiel de production** ;
- **Fourrages récoltés** = production fourragère / UGB_système (tMS/UGB).

### 5.4 Résultats

Le compte complet des stocks et des coûts, les indicateurs de dimensionnement
(E6–E9, autonomie, potentiel), et la **Bilan Global** (coûts par unité de
référence).

---

## 6. D'où vient quoi — traçabilité agronomique des données

| Donnée                                   | Origine agronomique                                              | Rôle dans le modèle                              |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| **Rendements & productions**             | baguettes (cultures) × surfaces, modulées par l'année climatique | production des stocks, pâture, paille            |
| **Valeurs nutritionnelles des aliments** | types de ration / concentrés / pâtures                           | couverture des besoins, composition de la ration |
| **Profil animal (CI, UFL, PDI)**         | profils animaux par période                                      | besoins en MS, énergie, protéines                |
| **Rations (proportions de fourrages)**   | saisie par lot + cartes custom                                   | consommation des stocks fourragers               |
| **Concentrés (kg/animal/j)**             | saisie par lot                                                   | consommation des stocks concentrés               |
| **Présence (nb × jours)**                | saisie par lot                                                   | toute consommation, UGB, litière                 |
| **Type de logement**                     | référentiel logement                                             | besoin de paille de litière                      |
| **Stocks initiaux**                      | saisie (1er janvier)                                             | stock final, achats                              |
| **Coûts (achat/vente/production)**       | saisie                                                           | compte des coûts, KPI                            |
| **SAU / SFP**                            | assolement                                                       | chargements E6–E9                                |

---

## 7. La boucle agronomique (ordre des calculs)

```
1. Référentiels chargés (cultures, aliments, profils, logements) + système actif
2. Ferme    : productions de fourrages, de pâture et de paille (par mois)
3. Grange   : stocks au 1er janvier + taux de refus
4. Troupeau : besoins (MS, énergie, protéines) → couvertures → consommations par stock
5. Bilan    : stock final (initial + production − consommation) → achats
              → coûts → dimensionnement (E6–E9, autonomie, potentiel)
```

Chaque bloc « alimente » le suivant : la production de la Ferme nourrit les stocks
de la Grange, les stocks + les rations du Troupeau déterminent les consommations,
et le Bilan fait le compte d'ensemble.

---

## 8. Hypothèses agronomiques clés & limites du modèle

### 8.1 Hypothèses structurantes

1. **Période = 28 jours** (13 périodes/an) : découpage du tableur de référence.
2. **1 UGB = 4,75 tMS** : convention de conversion MS ↔ bétail.
3. **Modération des VL par le potentiel de prairie** : les vaches laitières voient
   leurs besoins modérés (≈ −0,5 %) ; les autres lots non.
4. **Report de pâture minoré de 8 %** (facteur 0,92) : perte de qualité sur la
   pâture reportée d'un mois à l'autre.
5. **Refus appliqué en surcroît** : les pertes de distribution augmentent la
   consommation effective des stocks.
6. **Pâturage borné à la production** : la distribution de pâture est limitée par
   l'offre du mois et suit l'ordre de priorité des lots.
7. **Deux années climatiques** (normale / sèche) : les rendements de la même
   culture diffèrent selon l'année.

### 8.2 Limites du modèle (état des lieux)

- **Tourteaux** : les tourteaux (colza, soja…) peuvent être distribués comme
  concentrés mais ne sont rattachés à **aucun stock** → ils ne remontent pas dans
  le compte des stocks.
- **Valeurs des pâtures** : le modèle n'effectue pas de déclinaison distincte des
  valeurs nutritives des pâtures selon le type de système (vaches laitières /
  allaitantes) ; le même jeu de valeurs est mobilisé quel que soit le lot.
- **Périodes 100 % pâturées** : quand la ration d'une période est constituée
  uniquement de pâture (aucun fourrage stock distribué), la couverture peut ne pas
  s'afficher pour cette période.
- **Unités** : les céréales et protéagineux sont exprimés en **qtx**, tandis que
  la paille l'est en **tonnes** (les fourrages en tMS).

---

## 9. Lexique des unités et codes

| Terme                  | Définition                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MS** (matière sèche) | fraction solide du fourrage, base de tous les calculs nutritionnels                                                                                                                    |
| **tMS**                | tonne de matière sèche                                                                                                                                                                 |
| **UGB**                | unité de gros bétail ; 1 UGB = 4,75 tMS/an                                                                                                                                             |
| **UE**                 | unité fourragère (énergie d'ingestion) ; UEL = lait, UEB = élevage, UEM = maintien                                                                                                     |
| **UFL / UFV**          | valeurs énergétique du fourrage (lait / vaches)                                                                                                                                        |
| **PDI**                | protéines digestibles intestinales ; PDIN/PDIE/PDIinf = formes                                                                                                                         |
| **CI**                 | capacité d'ingestion (UE/animal/j)                                                                                                                                                     |
| **SFP**                | surface fourragère pâturable                                                                                                                                                           |
| **SAU**                | surface agricole utile                                                                                                                                                                 |
| **Codes de stock**     | `FH` foin · `FL` foin de légumineuse · `EH` ensilage d'herbe · `EM` ensilage de maïs · `EL` ensilage de légumineuse · `RC` céréales · `RP` protéagineux · `AS` autres · `STRAW` paille |
| **E6–E9**              | chargements SAU / apparent / corrigé / potentiel                                                                                                                                       |
| **DEF / DERm**         | densité énergétique fournie / nécessaire (UF/kgMS)                                                                                                                                     |
| **DPF / DPRm**         | densité protéique fournie / nécessaire                                                                                                                                                 |
