# Tickets — Rami liste (mail de Antoine Savoie, 2 oct. 2026)

> Source : mail `Rami liste` de Antoine Savoie (INRAE) du 02/10/2026 14:39.
> Les captures d'écran du mail sont dans `assets/` (image001.png → image016.png).
>
> Légende : 🔴 Bug · 🟠 Correction souhaitée · 🆕 Nouveauté · 📌 Tâche / à clarifier

---

## 1. 🔴 Bug — Carte ration ajoutée introuvable (Troupeau\lot et Grange)

**Demande (verbatim)** :
> Quand ajout de Carte ration (ex : foin Brenne), la carte ne ressort dans la liste des aliments (Troupeau\lot\). Même chose au niveau de la grange.

**Reproduction** :
1. Créer une carte ration (ex. « Foin Luzerne Brenne ») depuis *Mes configurations → Mes cartes rations* (cf. `assets/image003.png`).
2. Aller dans *Troupeau → lot → Ajouter un aliment* : la nouvelle carte n'apparaît pas dans la liste des aliments (cf. `assets/image004.png`).
3. Même constat dans la liste des stocks de la Grange (cf. `assets/image014.png`).

**Captures** :
- `assets/image003.png` — Mes cartes rations : « Foin Luzerne Brenne » (FH) et « Enrubannage Luzerne Brenne » (EH) créés.
- `assets/image004.png` — Modal « Ajouter un aliment » : seule la liste des aliments référentiels est proposée.
- `assets/image014.png` — Modal « Ajouter un stock » (Grange) : les cartes créées ne figurent pas non plus.

**Attendu** : toute carte ration créée dans *Mes configurations* doit être proposée dans :
- la liste des aliments d'un lot (Troupeau → lot → Aliments),
- la liste des stocks de la Grange (via le champ « Stock correspondant »).

---

## 2. 🔴 Bug — Paille non comptabilisée dans STOCKS et COUTS

**Demande (verbatim)** :
> La paille distribuée en alimentation n'est pas comptabilisée dans STOCKS et COUTS.
> On remarque que la paille des bâtiments (litière) n'est pas non plus consommée dans STOCKS et COUTS.

**Captures** :
- `assets/image008.png` — Tableau STOCKS ET COUTS, section « La paille » : paille 10000 / 0 / 0 / 23 / **-9977** / 9978 — la consommation n'est pas cohérente avec les besoins.
- `assets/image009.png` — Excel de référence : production de paille selon les cultures (colonne « Rdt paille (kg/ha) ») et besoins en paille selon les types de logement (kg/ugb/j) : la paille y est bien comptabilisée, en logement **et** en alimentation.
- `assets/image011.png` — Une baguette utilisée produit bien de la paille (dernière colonne) sur l'Excel.

**Attendu** :
- la paille **aliment** distribuée aux lots doit apparaître dans STOCKS (stock final) et COUTS ;
- la paille **logement** (litière, selon `straw_requirement` du type de logement × présence × besoin) doit être consommée aussi dans STOCKS et COUTS.

> ⚠️ Seche liée : voir le ticket **8** (aucune paille consommée pour le logement **ni** pour l'alimentation). Les deux demandent traitées de concert.

---

## 3. 🟠 Correction — Paille en tonnes (et céréales en tonnes)

**Demande (verbatim)** :
> Si possible, mettre la paille en tonne (aussi dans La grange). (=> les céréales peuvent aussi être mis en tonne)

**Captures** :
- `assets/image008.png` — la paille est affichée en unités non tonne dans STOCKS ET COUTS.

**Attendu** : afficher (et calculer) la paille en **tonnes** dans STOCKS ET COUTS et dans la Grange. Option demandé : faire de même pour les céréales (actuellement en qtx → passer en t).

---

## 4. 🟠 Correction — Troupeau → Présence : bouton « AJOUTER » inutile

**Demande (verbatim)** :
> Ce bouton ajouter semble inutile pour les présences.

**Captures** :
- `assets/image001.png` — onglet *Présence* d'un lot : le bouton « AJOUTER » est entouré d'un point d'interrogation ; la présence se gère par case par période (durée 0-28 j + nb animaux), un « ajouter » n'a pas de sens ici.

**Attendu** : retirer (ou justifier et documenter) le bouton « AJOUTER » de l'onglet Présence.

---

## 5. 🆕 Nouveauté — Mes configurations → Mes cartes rations (1) : dupliquer / adapter une carte

**Demande (verbatim)** :
> Besoin : adaptation d'un foin existant pour créer une version adaptée à un cas concret. Il n'est pas possible de créer une nouvelle carte ration à partir d'une existante.

**Captures** :
- `assets/image002.png` — formulaire « Créer une nouvelle carte ration » : tout est à saisir à zéro (nom, stock correspondant, 9 valeurs nutritionnelles).
- `assets/image003.png` — liste des cartes existantes (Foin Luzerne Brenne, Enrubannage Luzerne Brenne).

**Attendu** : permettre de créer une carte ration **à partir d'une carte existante** (clone avec pré-remplissage des valeurs nutritionnelles, nouveau nom), pour décliner un foin existant à un cas concret.

---

## 6. 🔴 Bug / 🆕 — Mes configurations → Mes cartes rations (2) : cartes créées introuvables dans « Troupeau »

**Demande (verbatim)** :
> J'ai créé 2 cartes rations : [capture]. Mais je ne les retrouve pas dans « troupeau » : [capture].

**Captures** :
- `assets/image003.png` — les 2 cartes rations créées.
- `assets/image004.png` — dans Troupeau, le dropdown « Aliments » ne les contient pas.

**Attendu** : les cartes rations créées dans *Mes configurations* doivent être disponibles dans le choix des aliments d'un lot du Troupeau.

> 📌 **Note** : cette demande est la même que le ticket **1** (côté Troupeau). Elle est conservée séparée car elle vient d'un échange distinct du mail ; à fusionner si besoin.

---

## 7. 🆕 Nouveauté — Mes configurations → Nouvelle baguette : décliner entre années climatiques

**Demande (verbatim)** :
> Il n'est pas possible de décliner une baguette d'une année climatique à une autre. Peut-être juste mettre une liste « normal/sec » pour ré-attribuer l'année climatique. Comme sur la gauche, il y a « Choisir le type de pâture ».

**Captures** :
- `assets/image010.png` — vue d'une baguette avec sa production par période et son mode d'exploitation par période (année climatique « normale », baguette « C1 Blé tendre NAC01 »).

**Attendu** : pouvoir **décliner une baguette d'une année climatique à une autre** (normale ↔ sèche), au minimum via une liste « normal / sec » pour ré-attribuer l'année climatique, sur le même principe que le sélecteur « Choisir le type de pâture » existant.

---

## 8. 🔴 Bug — Paille : aucune paille consommée (logement ET alimentation)

**Demande (verbatim)** :
> Paille : aucune paille n'est consommée : pour le logement, pour l'alimentation.
> possible (souhaitable) dans STOCKS ET COUT de distinguer paille logement et alimentation.

**Captures** :
- `assets/image005.png` — « Type de logement : Aire paillée intégrale » (le logement consomme de la paille en théorie).
- `assets/image007.png` — dans STOCKS ET COUTS, la paille est affichée avec une consommation incohérente (cf. ticket 2).
- `assets/image009.png` — Excel : la paille y est comptée à la fois en logement (besoins selon type de logement, kg/ugb/j) et en alimentation.
- `assets/image011.png` — la baguette produit bien de la paille (colonne de droite), donc la production existe mais n'est pas consommée dans le Rami.

**Attendu** :
- la paille **logement** doit être consommée (calcul de la litière selon type de logement) ;
- la paille **alimentation** doit être consommée ;
- (souhaitable) dans STOCKS ET COUTS, **distinguer paille logement / paille alimentation** en deux lignes ou sous-totaux.

> 📌 Seche liée : tickets **2** et **3**.

---

## 9. 🟠 Correction — Bilan : déplacer STOCKS ET COUTS (ordre des onglets)

**Demande (verbatim)** :
> Ordre des onglets : STOCK et COUT | Travail | Bilan Global

**Captures** :
- `assets/image006.png` — onglets actuels du Bilan dans l'ordre **Bilan Global | Travail | Stocks et coûts** ; la demande est de passer à **Stocks et coûts | Travail | Bilan Global**.

**Attendu** : réordonner les onglets du Bilan : **STOCKS ET COUTS d'abord**, puis Travail, puis Bilan Global.

---

## 10. 🔴 Bug — Périodes « vides » (couverture à 0 / grisées)

**Demande (verbatim)** :
> Comprendre pourquoi on a souvent des périodes « vides ».
> Apparemment : Ça peut être dans les cas où il n'y a que de la pâture distribuée. Si on met du foin (ex : 90% pâture et 10% foin, ça résout). Donc division par zéro ( ?)

**Captures** :
- `assets/image007.png` — graphique « Couverture des besoins par les fourrages et concentré » : les périodes P7 et P12 sont **grisées** (vides) alors que des animaux sont présents.

**Attendu** : comprendre et corriger l'affichage des périodes vides. Hypothèse du mail : **division par zéro** quand 100 % de la ration est en pâture (pas de fourrage stock distribué). Ces périodes doivent afficher une couverture calculée, pas un bloc gris.

---

## 11. 🆕 Nouveauté — Assolement : compteur de surface utilisée

**Demande (verbatim)** :
> Assolement : ajouter un compteur de surface. Pour savoir si on a utilisé toute la surface disponible.
> Bonus : dégager les Surfaces à Contraintes dans le formulaire (et les contraintes associées) car on ne s'en sert pas.

**Captures** :
- (aucune capture liée dans le mail)

**Attendu** :
- ajouter un **compteur de surface utilisée / surface disponible (SAU)** dans le formulaire d'assolement, pour savoir si toute la surface est exploitée ;
- (bonus) retirer les **Surfaces à Contraintes** et leurs contraintes du formulaire, non utilisées.

---

## 12. 🆕 Nouveauté — Concentrés : tourteaux (colza, soja, …) absents de Stocks et Coûts — [Priorité haute]

**Demande (verbatim)** :
> Concentrés : Tourteaux de colza, de soja, etc. On peut les fournir comme concentré, mais ils ne sont pas présents dans Stocks et Coûts.
> Explication (colonne Stock_correspondant) : cf. colonne noire.
> Option 1 : juste attribuer RP aux lignes Tourteau dans la colonne en noir.
> Option 2 : créer une catégorie RT (T pour tourteau) et du coup créer une nouvelle ligne dans STOCKS ET COUTS.

**Captures** :
- `assets/image012.png` — « Les concentrés pour la période » : « Concentré céréales » 0,65 et « **Tourteau de colza** » 0,35 (surligné) : le tourteau est distribuable.
- `assets/image013.png` — dans Stocks et Coûts, seul « Protéagineux en grain » apparaît : les tourteaux n'y figurent pas.
- `assets/image016.png` — export CSV référentiel : la colonne `Stock_correspondant` (noire) vaut **RC** pour « Concentré céréales » mais est **vide pour les tourteaux** (colza, soja, …) → c'est pourquoi ils ne remontent pas dans les stocks.

**Attendu** (choisir l'option) :
- **Option 1** : attribuer `RP` aux lignes « Tourteau » dans la colonne `Stock_correspondant` du référentiel ;
- **Option 2** : créer une nouvelle catégorie **RT** (tourteau) et ajouter une ligne dédiée dans STOCKS ET COUTS.

> 📌 À trancher avec l'équipe. L'Option 2 est la plus propre mais impacte le référentiel + le calcul des stocks + l'affichage.

---

## 13. 🟠 Correction — Grange : réorganiser la liste des stocks — [Priorité basse]

**Demande (verbatim)** :
> Grange : réorganiser la liste. Pour s'y retrouver plus facilement. Ordre proposé pour les 8 catégories :
> « Foin, Foin de légumineuses, ensilage et enrub d'herbe, ensilage de maïs et sorgho, ensilage de légumineuse, céréales en grain, protéagineux en grain, autre stock »

**Captures** :
- `assets/image014.png` — modal « Ajouter un stock » : l'ordre actuel des types de stock est différent (Ensilage de maïs et sorgho, Céréales en grain, Protéagineux en grain, autre stock, Ensilage de légumineuses, Foin de légumineuses, …).

**Attendu** : réordonner la liste des types de stock de la Grange dans l'ordre proposé (8 catégories).

> 📌 Tâche associée du mail : **Antoine doit mettre les trucs dans l'ordre dans le csv** — et on constate qu'on n'a pas les tourteaux dans ce csv (cf. ticket 12).

---

## 14. 📌 À clarifier — Valeurs alimentaires des pâtures (commentaire Excel)

**Demande (verbatim)** :
> Valeurs alimentaires des pâtures : comment gérer le commentaire ci-dessous ?

**Captures** :
- `assets/image015.png` — extrait Excel « Valeurs nutritives (UF-PDI) des types de pâtures » : le commentaire rouge indique que pour des systèmes en **vaches allaitantes (VA)** il peut être utile de **baaisser la valeur de certaines pâtures** (graminées, légumineuses et monospécifiques) — avec une table de valeurs VL vs VA (UFL/UFV/PDIN/PDIE/PDIinf) à copier-coller « si on veut utiliser ».

**Attendu** : définir comment gérer dans le Rami la **déclinaison des valeurs alimentaires des pâtures selon le type de système (VL / VA)** — soit un jeu de valeurs VA distinct, soit un facteur de minoration, à clarifier avec INRAE.

> 📌 Tâche de clarification : aucune décision n'est demandée dans le mail, il s'agit de répondre à la question et de cadrer la solution.

---

## Résumé des priorités

| # | Ticket | Type | Priorité |
|---|--------|------|----------|
| 1 | Carte ration introuvable (Troupeau/Grange) | Bug | Hautes |
| 2 | Paille non comptabilisée (STOCKS/COUTS) | Bug | Hautes |
| 3 | Paille (et céréales) en tonnes | Correction | Moyenne |
| 4 | Bouton « AJOUTER » Présence inutile | Correction | Basse |
| 5 | Dupliquer / adapter une carte ration | Nouveauté | Moyenne |
| 6 | Cartes rations introuvables dans Troupeau | Bug | Hautes (= 1) |
| 7 | Décliner une baguette entre années climatiques | Nouveauté | Moyenne |
| 8 | Aucune paille consommée (logement + alimentation) | Bug | Hautes |
| 9 | Réordonner les onglets du Bilan | Correction | Basse |
| 10 | Périodes vides (division par zéro ?) | Bug | Moyenne |
| 11 | Compteur de surface Assolement (+ retrait contraintes) | Nouveauté | Moyenne |
| 12 | Tourteaux absents de Stocks et Coûts | Nouveauté | **Haute (coulée)** |
| 13 | Réorganiser la liste de la Grange | Correction | Basse |
| 14 | Valeurs pâtures VL/VA | À clarifier | Moyenne |
