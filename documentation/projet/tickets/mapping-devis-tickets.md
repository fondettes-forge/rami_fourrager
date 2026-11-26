# Mapping Devis ↔ Tickets — Analyse de couverture

> Source : `tache rami en devis.ods` (devis Antoine Savoie / INRAE, 2025) + mail
> « Rami liste » (02/10/2026) → [Rami-liste-tickets.md](Rami-liste-tickets.md).
> Date de l'analyse : 2026-11-18 (relecture complète du .ods, colonne « fait »
> corrigée).
>
> **Objectif** : vérifier que les 24 tickets couvrent les items du tableau de
> devis, et identifier ce qui n'a **pas de ticket** (à créer).
>
> **Complément** : voir [devis_en_attente/INDEX.md](../devis_en_attente/INDEX.md)
> pour la **vue par devis** (chaque devis 01D–05D avec ses tâches, son total,
> son statut de facturation, et les tickets associés).

---

## 1. Légende

| Marque | Sens                                                          |
| ------ | ------------------------------------------------------------- |
| ✅     | Fait (colonne « fait » = ok dans le .ods, ou vérifié au code) |
| 📄     | Ticket existant (doc écrite, à implémenter)                   |
| ⚠️     | Partiellement couvert / à clarifier                           |
| ❌     | **Pas de ticket — à créer**                                   |

> **Règle** : une ligne du .ods marquée « ok » (colonne « fait ») ou dont la
> priorité = « ok » est **déjà faite** → pas de ticket. Seules les lignes sans
> « ok » (priorité numérique = à faire) sont couvertes par des tickets.

---

## 2. Tableau de correspondance

### A. Corrections — devis `2025081801D` (correctifs)

| Ligne | Item (résumé)                                                    | « fait » | Ticket | Statut  |
| ----- | ---------------------------------------------------------------- | -------- | ------ | ------- |
| 4     | Écarts de calcul couverture (arrondi Excel vs app, facteur 0,92) | **ok**   | —      | ✅ fait |
| 5     | Écarts concentrés / P1 non affiché dans le graph                 | **ok**   | —      | ✅ fait |
| 6     | Problèmes modification assolement (changement de surfaces)       | **ok**   | —      | ✅ fait |
| 7     | Bouton « modifier » stock Grange ne marche pas                   | **ok**   | —      | ✅ fait |

### B. Corrections / UX — devis `2025081802D`

| Ligne | Item (résumé)                                                               | « fait »        | Ticket                                                   | Statut                                                       |
| ----- | --------------------------------------------------------------------------- | --------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| 9     | Champs facultatifs/obligatoires (baguettes + profils animaux)               | — (p. 5, 1/2 j) | [ticket-17](tickets/ticket-17-validation-formulaires.md) | 📄 à implémenter                                             |
| 10    | Info-bulle « nb génisses à garder »                                         | —               | [ticket-18](tickets/ticket-18-tooltip-genisses.md)       | 📄 à implémenter                                             |
| 11    | Graphique « pâture verte disponible et besoin du troupeau » (Assolement)    | —               | [ticket-19](tickets/ticket-19-graph-pature-verte.md)     | 📄 à implémenter                                             |
| 12    | Modification des textes de traductions (lignée mère)                        | **ok**          | —                                                        | ✅ fait                                                      |
| 14    | « soutien » plutôt que « soutient » (bandeau de gauche)                     | **ok**          | —                                                        | ✅ fait — vérifié `fr.json` L130 : « Avec le soutien de : »  |
| 15    | « Âge en mois » → « âge au vêlage »                                         | **ok**          | —                                                        | ✅ fait                                                      |
| 16    | « Poids à la naissance » → « poids au vêlage »                              | **ok**          | —                                                        | ✅ fait — vérifié `fr.json` L842 : « Poids au vêlage en kg » |
| 17    | NEC_MB → « Note d'état corporel à la mise bas »                             | **ok**          | —                                                        | ✅ fait — vérifié `fr.json` L840                             |
| 18    | « Durée de lacatation » → « Durée de lactation (en jours) »                 | **ok**          | —                                                        | ✅ fait — vérifié `fr.json` L841                             |
| 19    | 2e poids naissance → « poids du veau » (séparer vache/veau)                 | **ok**          | —                                                        | ✅ fait                                                      |
| 20    | « Nom de la ration » → « nom de l'aliment »                                 | **ok**          | —                                                        | ✅ fait — vérifié `fr.json` L410/L572                        |
| 21    | « Ajouter une ration » → « Ajouter un aliment »                             | **ok**          | —                                                        | ✅ fait — vérifié `fr.json` L395/L417                        |
| 22    | « Ration » → « Aliment »                                                    | **ok**          | —                                                        | ✅ fait                                                      |
| 23    | Titre graphique → « Couverture des besoins par les fourrages et concentré » | **ok**          | —                                                        | ✅ fait — vérifié `fr.json` L422                             |

### C. Nouvelles fonctionnalités — devis `2025081803D` → `05D`

| Ligne | Item (résumé)                                                             | « fait »               | Ticket                                                   | Statut                             |
| ----- | ------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------- | ---------------------------------- |
| 26    | Formulaire création/màj/suppression **site perso** (+ années climatiques) | — (p. « à voir », 2 j) | [ticket-20](tickets/ticket-20-gestion-sites.md)          | 📄 à implémenter                   |
| 28    | **Duplication de simulation** (« Enregistrer-sous »)                      | — (p. 4, 1 j)          | [ticket-21](tickets/ticket-21-duplication-simulation.md) | 📄 à implémenter                   |
| 30    | Page des **partenaires** — pop-up avec tous les logos                     | — (p. 6, 1 j)          | [ticket-25](tickets/ticket-25-page-partenaires.md)       | ⏳ au backlog ([BL-3](BACKLOG.md)) |

> **Vérification R31** : `PartnersPage.vue` existe déjà avec **tous les logos**
> (7 blocs : financeurs, partenaires projet, développement, partenaires
> scientifiques, 12 logos au total). Ce qui manque est le **mode « pop-up »**
> (la page actuelle est une page route dédiée, pas un pop-up) → ticket 25.

### D. Items hors devis numéroté (bas du tableau)

| Ligne | Item (résumé)                                                                     | « fait » | Ticket                                                 | Statut           |
| ----- | --------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ | ---------------- |
| 32    | Ajouter colonne « source » pour les baguettes                                     | —        | [ticket-22](tickets/ticket-22-source-baguettes.md)     | 📄 à implémenter |
| 34    | Créer des baguettes d'un site sur **un autre site** (+ griser champs recherche)   | **ok**   | —                                                      | ✅ fait          |
| 37    | Formulaire **login** : rien ne se passe si erreur / user inexistant               | —        | [ticket-23](tickets/ticket-23-feedback-login.md)       | 📄 à implémenter |
| 39    | **Métadonnées** référentiel (+ champ résumé baguette, doc injecteur, suppression) | —        | [ticket-24](tickets/ticket-24-metadata-referentiel.md) | 📄 à implémenter |

### E. Tickets du mail (02/10/2026) — pas dans le devis 2025

| #      | Ticket                                             | Source    | Statut                         |
| ------ | -------------------------------------------------- | --------- | ------------------------------ |
| 1 (+6) | Carte ration introuvable                           | mail      | ✅ fait                        |
| 2+8    | Bloc paille (STOCKS/COUTS, conso logement/aliment) | mail      | ✅ fait                        |
| 3 §2.1 | Paille en tonnes                                   | mail      | ✅ fait                        |
| 3 §2.2 | Céréales en tonnes                                 | mail      | ⏳ backlog BL-1                |
| 4      | Bouton AJOUTER Présence                            | mail      | ✅ fait                        |
| 5      | Dupliquer / adapter une carte ration               | mail      | 📄 à implémenter               |
| 7      | Décliner baguette entre années climatiques         | mail      | 📄 à implémenter               |
| 9      | Réordonner onglets Bilan                           | mail      | ✅ fait                        |
| 10     | Périodes vides (division par zéro)                 | mail      | 📄 à implémenter               |
| 11     | Compteur de surface Assolement                     | mail      | 📄 à implémenter               |
| 12     | Tourteaux absents de Stocks et Coûts               | mail      | 📄 **à trancher** (Option 1/2) |
| 13     | Réorganiser liste Grange                           | mail      | ✅ fait                        |
| 14     | Valeurs pâtures VL/VA                              | mail      | ⏳ à clarifier INRAE           |
| 15     | AnimalProfileModal (batch_type)                    | TODO code | 📄 à implémenter               |
| 16     | Export (nom obligatoire + colonnes)                | TODO code | 📄 à implémenter               |

> Les tickets 1–16 viennent du **mail d'oct. 2026** et ne sont **pas** dans le
> tableau de devis 2025 (qui est antérieur). Ils sont listés ici pour complétude.

---

## 3. Synthèse — Tickets créés

| #   | Titre                                                                   | Source               | Effort estimé |
| --- | ----------------------------------------------------------------------- | -------------------- | ------------- |
| 17  | Validation formulaires : champs facultatifs/obligatoires                | Devis 02D (ligne 9)  | ~0,5 j        |
| 18  | Tooltip « nb génisses à garder »                                        | Devis 02D (ligne 10) | ~0,1 j        |
| 19  | Graphique « pâture verte disponible et besoin du troupeau »             | Devis 02D (ligne 11) | ~1 j          |
| 20  | Formulaire gestion sites (création/màj/supp + années climatiques)       | Devis 03D (ligne 26) | ~2 j          |
| 21  | Duplication de simulation (« Enregistrer-sous »)                        | Devis 04D (ligne 28) | ~1 j          |
| 22  | Colonne « source » pour les baguettes                                   | Devis (ligne 32)     | ~0,5 j        |
| 23  | Feedback login (erreur / user inexistant)                               | Devis (ligne 37)     | ~0,5 j        |
| 24  | Métadonnées référentiel (+ résumé baguette, doc injecteur, suppression) | Devis (ligne 39)     | ~2 j          |
| 25  | Page des partenaires : mode pop-up logos                                | Devis 05D (ligne 30) | ~0,5 j        |

**Total nouveaux tickets : 9** (effort cumulé ≈ **8,1 jours**)

---

## 4. Couverture globale

| Source                          | Items | Déjà faits (« fait » = ok) | À implémenter (tickets)    |
| ------------------------------- | ----- | -------------------------- | -------------------------- |
| Devis 01D (corrections)         | 4     | **4** (lignes 4–7)         | 0                          |
| Devis 02D (UX/traductions)      | 14    | **11** (lignes 12, 14–23)  | **3** (tickets 17–19)      |
| Devis 03D–05D (fonctionnalités) | 3     | 0                          | **3** (tickets 20, 21, 25) |
| Hors devis (bas tableau)        | 4     | **1** (ligne 34)           | **3** (tickets 22–24)      |
| Mail oct. 2026                  | 16    | —                          | 16 (tickets 1–16)          |

**Bilan** :

- Les **16 tickets du mail** (oct. 2026) couvrent bien les demandes d'octobre.
- Le **devis 2025** : **16 items déjà faits** (colonne « fait » = ok), **9
  nouveaux tickets** à implémenter (numérotation 17–25), effort cumulé ≈
  **8,1 jours**.
- **Total de la gestion** : 25 tickets (16 mail + 9 devis).

---

## 5. Prochaines étapes suggérées

1. **Valider avec Antoine** les tickets 17–25 (priorités, périmètre, effort).
2. **Prioriser** :
   - **Fonctionnalités à forte valeur** (20 sites ~2 j, 24 métadonnées ~2 j,
     21 duplication simu ~1 j) → à planifier.
   - **UX rapides** (17 validation, 18 tooltip, 19 graph pâture, 25 pop-up
     partenaires) → à glisser.
   - **Feedback login** (23) → à corriger (bug utilisateur).
3. **Confirmer** que les items « fait = ok » sont bien dans le code actuel
   (vérification par recette) — 4 traductions déjà vérifiées dans `fr.json`.
