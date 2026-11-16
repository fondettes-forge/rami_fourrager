# Ticket 11 — Assolement : compteur de surface utilisée (+ retrait contraintes)

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §11.
> Statut : **à traiter** · Priorité : **moyenne** · Type : nouveauté
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Assolement : ajouter un compteur de surface. Pour savoir si on a utilisé toute
> la surface disponible.
> Bonus : dégager les Surfaces à Contraintes dans le formulaire (et les
> contraintes associées) car on ne s'en sert pas.

### 1.2 État actuel (`views/simulator/Farm.vue`)

Le formulaire d'assolement a deux zones :

1. **Dimensionnement** (L21-74) :
   - le champ **SAU** (`dimensioning.SAU`, L24-32) ;
   - le sous-bloc **« Surfaces à Contraintes »** (L36-71) : 4 champs
     `irrigable`, `ploughable`, `superficial`, `reachable`
     (`dimensioning.constrainedSurfaces`).
2. **Table des rotations** (L84-226) : chaque rotation a une `surface`.

Les getters `farm.js` :

- `totalSurfaces` (L81) : somme des `rotation.surface` ;
- `totalConstrainedSurfaces` (L87) : somme des `constrainedSurfaces` ;
- `validateRotation` (L93) : vérifie `totalSurfaces + new ≤ SAU` **et**, si la
  rotation a une contrainte, `totalConstrained + new ≤ constrainedSurfaces[contrainte]` ;
- `validateSurface` (L123) : `totalConstrainedSurfaces ≤ SAU`.

➡️ **Le compteur de surface utilisée existe déjà en interne**
(`totalSurfaces`), mais **n'est pas affiché** dans le formulaire. L'utilisateur
ne voit pas « X ha utilisés sur Y ha (SAU) ».

### 1.3 Les contraintes (bonus)

Les « Surfaces à Contraintes » sont :

- saisies dans le formulaire (4 champs, L39-71) ;
- utilisées par `validateRotation` (L100-114) : si une rotation a une
  `constraint`, sa surface compte dans le total de cette contrainte ;
- affichées dans la table des rotations (colonne `constraint.name`, L203) et
  dans le modal de rotation (select `constraintsList`, L143-152).

Le mail dit « on ne s'en sert pas ». **Mais** : si on retire les contraintes du
formulaire, il faut aussi retirer le **select de contrainte** du modal de
rotation (sinon, on ne peut plus attribuer de contrainte) et simplifier
`validateRotation` (ne plus vérifier que la contrainte).

### 1.4 Résumé

| # | Point | Où | Action |
|---|-------|----|--------|
| S1 | Pas de compteur « surface utilisée / SAU » affiché | `Farm.vue` (dimensionnement) | afficher `totalSurfaces` / `SAU` |
| S2 | « Surfaces à Contraintes » non utilisées (bonus) | `Farm.vue` L36-71, modal rotation L143-152, `farm.js` L100-114 | retirer (bonus, à valider) |

---

## 2. Recommandations (plan de correction)

### 2.1 Compteur de surface utilisée (S1) — **à faire**

Dans le bloc **Dimensionnement** de `Farm.vue` (après le champ SAU, L33),
ajouter un **libellé de compteur** :

```
Surface utilisée : {totalSurfaces} ha / {SAU} ha
```

- **Vert** si `totalSurfaces ≤ SAU` ;
- **Orange** si `totalSurfaces < SAU` (surface restante) ;
- **Rouge** si `totalSurfaces > SAU` (dépassement — déjà bloqué par
  `validateRotation`, mais le compteur le rend visible).

Implémentation : un `v-subheader` ou un `div` avec le getter `totalSurfaces`
(mappé depuis `simulator/farm`). Pas de calcul nouveau — `totalSurfaces`
existe déjà.

➡️ **Bonus d'affichage** : montrer aussi le **reste** :
`SAU − totalSurfaces` ha disponibles.

### 2.2 Retrait des Surfaces à Contraintes (S2) — **bonus, à valider**

Si validé avec Antoine (confirmer qu'elles ne servent vraiment pas) :

1. **`Farm.vue`** :
   - retirer le sous-bloc « Surfaces à Contraintes » (L36-71) ;
   - retirer le select `constraintsList` du modal de rotation (L143-152) ;
   - retirer la colonne `constraint.name` de la table (L203, L252) ;
   - retirer les computed `irrigable`/`ploughable`/`superficial`/`reachable`
     (L331-362) et `constraintsList` (L256-261).
2. **`farm.js`** :
   - `validateRotation` (L93) : retirer la branche contrainte (L100-114) —
     ne vérifier que `totalSurfaces + new ≤ SAU` ;
   - retirer `totalConstrainedSurfaces` (L87) et `validateSurface` (L123)
     (si plus utilisés).
3. **`dimensioning.constrainedSurfaces`** : garder le champ dans le state
   (les workspaces existants l'ont) mais ne plus l'afficher/saisir. **Pas de
   migration** (le champ reste, inutilisé).
4. **`fr.json`** : retirer/neutraliser les clés `farm.dimensioning.*`
   contraintes.

⚠️ **Point de vigilance** : si une rotation **existante** a une `constraint`,
retirer le select fait disparaître la contrainte de l'affichage mais **reste
dans le workspace** (`rotation.constraint`). À nettoyer (ou ignorer, puisque
`validateRotation` ne la vérifiera plus).

---

## 3. Fichiers impactés (récap)

| Fichier | Changement |
|---------|-----------|
| `src/views/simulator/Farm.vue` | compteur surface (2.1) ; retrait contraintes (2.2, bonus) |
| `src/store/modules/farm.js` | (2.2) simplifier `validateRotation`, retirer `totalConstrainedSurfaces`/`validateSurface` |
| `src/locales/fr.json` | libellé compteur (2.1) ; retrait clés contraintes (2.2) |

---

## 4. Critères d'acceptation

1. Dans *Assolement*, le formulaire affiche **« Surface utilisée : X ha / Y ha
   (SAU) »** avec un code couleur (vert/orange/rouge).
2. Le compteur est **à jour** en temps réel (ajout/suppression/édition d'une
   rotation).
3. (Bonus 2.2) les « Surfaces à Contraintes » et le select de contrainte du
   modal de rotation sont **retirés** ; `validateRotation` ne vérifie que la SAU.

## 5. Risques / points d'attention

- **2.2 est un bonus** : ne pas le faire sans validation d'Antoine (les
  contraintes pourraient servir à un usage futur). Le **2.1 seul** est sans
  risque.
- **Workspaces existants** : les `constrainedSurfaces` et les `rotation.constraint`
  restent dans le JSON (pas de migration) — simplement non affichés/non vérifiés
  (2.2).
- **Le compteur (2.1) ne change aucun calcul** : il affiche `totalSurfaces`
  qui existe déjà.

## 6. Estimation

| Bloc | Effort |
|------|--------|
| Compteur surface (2.1) | ~0,25 j |
| Retrait contraintes (2.2, bonus) | ~0,5 j |
| Tests / validation | ~0,25 j |
| **Total** | **~0,5 j** (2.1 seul) / **~1 j** (avec 2.2) |
