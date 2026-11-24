# Index des tickets — Rami

> Liste de référence : [Rami-liste-tickets.md](Rami-liste-tickets.md) (mail oct. 2026)
>
> - [mapping-devis-tickets.md](mapping-devis-tickets.md) (devis 2025) — vue
>   **par ticket** (couverture des items du .ods).
> - [devis_en_attente/INDEX.md](../devis_en_attente/INDEX.md) — vue
>   **par devis** (chaque devis 01D–05D avec ses tâches, son total, son statut
>   de facturation, et les tickets associés).
> - Chaque ticket a une doc d'analyse/préco dédiée (`ticket-N-slug.md`).
>   Travaux non traités : [BACKLOG.md](BACKLOG.md).
>   Chaque ticket indique sa **provenance** (mail oct. 2026 / devis 2025 / TODO code).
>   Mise à jour : 2026-11-24 (tickets 12, 23, 10, 16).

## Légende statut

| Statut                      | Sens                                               |
| --------------------------- | -------------------------------------------------- |
| ✅ **Implémenté**           | code corrigé + tests, non commit (validé en local) |
| 📄 **Doc écrite**           | analyse/préco faite, à implémenter                 |
| 📄 **Doc écrite (doublon)** | doublon d'un autre ticket, corrigé via celui-ci    |
| ⏳ **À clarifier**          | en attente de décision (INRAE/équipe)              |
| ❌ **Non traité**           | ni doc, ni code                                    |

## Tableau de bord

| #   | Ticket                                                      | Type        | Priorité  | Statut                 | Doc                                                   | Provenance                 | Dépendances / notes                                                                           |
| --- | ----------------------------------------------------------- | ----------- | --------- | ---------------------- | ----------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Carte ration introuvable (Troupeau/Grange)                  | Bug         | Haute     | ✅ Implémenté          | [ticket-1](ticket-1-carte-ration-introuvable.md)      | Mail oct. 2026             | — (ticket 6 en dépend)                                                                        |
| 2   | Paille non comptabilisée (STOCKS/COUTS)                     | Bug         | Haute     | ✅ Implémenté          | [ticket-2](ticket-2-paille-stocks-couts.md)           | Mail oct. 2026             | **= ticket 8** (même bloc paille, traité de concert)                                          |
| 3   | Paille (et céréales) en tonnes                              | Correction  | Moyenne   | ✅ **Partiel** (2.1)   | [ticket-3](ticket-3-paille-cereales-tonnes.md)        | Mail oct. 2026             | paille ✅ ; 2.2 céréales → [backlog BL-1](BACKLOG.md)                                         |
| 4   | Bouton « AJOUTER » Présence inutile                         | Correction  | Basse     | ✅ Implémenté          | [ticket-4](ticket-4-bouton-ajouter-presence.md)       | Mail oct. 2026             | — (prop `showAddButton` sur PeriodLayout)                                                     |
| 5   | Dupliquer / adapter une carte ration                        | Nouveauté   | Moyenne   | ✅ Implémenté          | [ticket-5](ticket-5-dupliquer-carte-ration.md)        | Mail oct. 2026             | icône copier + pré-remplissage (dépend ticket 1)                                              |
| 6   | Cartes rations introuvables dans Troupeau                   | Bug         | Haute     | 📄 **Doublon du 1** ✅ | [ticket-6](ticket-6-carte-ration-troupeau.md)         | Mail oct. 2026             | **= ticket 1** (fusionner)                                                                    |
| 7   | Décliner une baguette entre années climatiques              | Nouveauté   | Moyenne   | ✅ Implémenté (B1+B3)  | [ticket-7](ticket-7-baguette-annees-climatiques.md)   | Mail oct. 2026             | fix B1 (climatic_year_id destination) ; option 2.3 (depuis l'édition) à clarifier             |
| 8   | Aucune paille consommée (logement + alimentation)           | Bug         | Haute     | ✅ Implémenté          | [ticket-8](ticket-8-paille-aucune-conso.md)           | Mail oct. 2026             | **= ticket 2** (même bloc) ; dépend du 1 ; 100 % frontend                                     |
| 9   | Réordonner les onglets du Bilan                             | Correction  | Basse     | ✅ Implémenté          | [ticket-9](ticket-9-ordre-onglets-bilan.md)           | Mail oct. 2026             | — (simple réordonnancement)                                                                   |
| 10  | Périodes vides (division par zéro ?)                        | Bug         | Moyenne   | ✅ Implémenté          | [ticket-10](ticket-10-periodes-vides.md)              | Mail oct. 2026             | V3 (garde anti-`Infinity`) + V2 (affichage) ; V1 (tooltip) à faire si validé INRAE            |
| 11  | Compteur de surface Assolement (+ retrait contraintes)      | Nouveauté   | Moyenne   | ✅ Implémenté (2.1)    | [ticket-11](ticket-11-compteur-surface-assolement.md) | Mail oct. 2026             | 2.1 compteur ✅ ; 2.2 retrait contraintes = bonus à valider (pas fait)                        |
| 12  | Tourteaux absents de Stocks et Coûts                        | Nouveauté   | **Haute** | ✅ Implémenté (RT)     | [ticket-12](ticket-12-tourteaux-stocks-couts.md)      | Mail oct. 2026             | **Option 2 (RT) implémentée** ; re-seed CSV à faire ; annexe T4 (RC-RP) séparé                |
| 13  | Réorganiser la liste de la Grange                           | Correction  | Basse     | ✅ Implémenté          | [ticket-13](ticket-13-reorganiser-grange.md)          | Mail oct. 2026             | STRAW en fin (ticket 8) ; **RT inséré après RP** (ticket 12) — ordre `…RC, RP, RT, AS, STRAW` |
| 14  | Valeurs pâtures VL/VA                                       | À clarifier | Moyenne   | ⏳ **À clarifier**     | [ticket-14](ticket-14-valeurs-patuares-vl-va.md)      | Mail oct. 2026             | **décision INRAE requise** avant code                                                         |
| 15  | AnimalProfileModal : batch_type + rafraîchissement profils  | Bug         | Moyenne   | ✅ Implémenté          | [ticket-15](ticket-15-animal-profile-batch-type.md)   | TODO code                  | batch_type à blanc + refresh profils (groupé avec 17)                                         |
| 16  | Export : nom obligatoire + colonnes manquantes              | Bug         | Moyenne   | ✅ Implémenté          | [ticket-16](ticket-16-export-nom-colonnes.md)         | TODO code                  | A (nom obligatoire) + B (message si simulation vide)                                          |
| 17  | Validation formulaires : champs facultatifs/obligatoires    | Correction  | Moyenne   | ✅ Implémenté (profil) | [ticket-17](ticket-17-validation-formulaires.md)      | Devis 2025 (R10)           | Profils animaux ✅ (groupé avec 15) ; baguettes à faire                                       |
| 18  | Tooltip « nb génisses à garder »                            | Correction  | Basse     | ✅ Implémenté          | [ticket-18](ticket-18-tooltip-genisses.md)            | Devis 2025 (R11)           | v-tooltip sur le champ « Nombre d'animaux » (HerdModal + BatchDetails)                        |
| 19  | Graphique « pâture verte disponible et besoin du troupeau » | Nouveauté   | Moyenne   | 📄 Doc écrite          | [ticket-19](ticket-19-graph-pature-verte.md)          | Devis 2025 (R12)           | À mettre dans le module Assolement                                                            |
| 20  | Formulaire gestion sites (création/màj/supp + années)       | Nouveauté   | **Haute** | 📄 Doc écrite          | [ticket-20](ticket-20-gestion-sites.md)               | Devis 2025 (R27)           | Triptyque site → année → baguette ; backend + frontend                                        |
| 21  | Duplication de simulation (« Enregistrer-sous »)            | Nouveauté   | Moyenne   | 📄 Doc écrite          | [ticket-21](ticket-21-duplication-simulation.md)      | Devis 2025 (R29)           | —                                                                                             |
| 22  | Colonne « source » pour les baguettes                       | Nouveauté   | Basse     | ✅ Implémenté          | [ticket-22](ticket-22-source-baguettes.md)            | Devis 2025 (R33)           | Backend + frontend ; migration `d3f8a21c9b4e` à exécuter + re-seed                            |
| 23  | Feedback login (erreur / user inexistant)                   | Bug         | Moyenne   | ✅ Implémenté          | [ticket-23](ticket-23-feedback-login.md)              | Devis 2025 (R38)           | `v-alert` + state.error + i18n                                                                |
| 24  | Métadonnées référentiel (résumé baguette + doc injecteur)   | Nouveauté   | **Haute** | 📄 Doc écrite          | [ticket-24](ticket-24-metadata-referentiel.md)        | Devis 2025 (R40, ligne 39) | Résumé + doc injecteur ; **suppression → [BL-2](BACKLOG.md)** (2026-11-23)                    |
| 25  | Page des partenaires : mode pop-up logos                    | Correction  | Moyenne   | ⏳ **Au backlog**      | [ticket-25](ticket-25-page-partenaires.md)            | Devis 2025 (R31, ligne 30) | **Entièrement au backlog [BL-3](BACKLOG.md)** (2026-11-23) ; devis 04D suspendu               |

## Synthèse

- **Total** : 25 tickets (16 du mail oct. 2026 + 9 du devis 2025).
- **Implémenté** : 20/25 (tickets 1, 2+8 [bloc paille], 3 [2.1 paille en tonnes], 4 [bouton Présence], 5 [dupliquer carte], 7 [décliner baguette B1+B3], 9 [onglets Bilan], 10 [périodes vides V2+V3], 11 [compteur surface 2.1], 12 [tourteaux RT], 13 [Grange], 15 [batch_type], 16 [export nom + colonnes], 17 [validation profil], 18 [tooltip génisses], 22 [source baguettes], 23 [feedback login]) — le ticket 6 est le doublon du 1.
- **Doc écrite, prête à implémenter** : 5/25 (tickets 19, 20, 21, 24, 25).
- **À clarifier (décision requise)** : 1/25 (ticket 14, INRAE) ; + à trancher : option 12 (1/2), bonus 11, option 2.2 du ticket 3 (céréales → backlog BL-1).
- **Au backlog** : ticket 25 (BL-3, pop-up partenaires) + suppression référentiel ex-ticket 24 §2.2 (BL-2) — décision 2026-11-23.

## Blocs de travail suggérés

1. **Bloc paille (tickets 2 + 8)** ✅ **fait** (commité) — 100 % frontend, `Rdt_paille`
   déjà dans `Stic.rendement`.
2. **Bloc simple/rapide** :
   (tickets 4 ✅, 9 ✅, 11 ✅ [2.1 compteur], 13 ✅ faits)
3. **Ticket 12 (tourteaux)** — **Option 2 (RT) implémentée** (2026-11-24) : nouveau
   code de stock `RT` (tourteaux), traçabilité dédiée, 4 points de contact store +
   UI Grange + CSV. **Re-seed du CSV** à faire en base. Annexe T4 (`RC-RP`) à
   traiter séparément.
4. **Tickets UX** : ticket 5 (dupliquer carte ✅), ticket 7 (décliner
   baguette ✅ B1+B3, option 2.3 à clarifier), ticket 10 (périodes vides, ~1,5 j).
5. **Ticket 14** — en attente de réponse INRAE (aucun code avant décision).

6. **Tickets TODO code** : ticket 15 (AnimalProfileModal, ~0,75 j), ticket 16
   (Export, ~1,5 j).

7. **Tickets devis 2025 restants** : 17 (~0,5 j), 18 (~0,1 j), 19 (~1 j),
   20 (~2 j), 21 (~1 j), 23 (~0,5 j), 24 (~2 j), 25 (~0,5 j) — 22 ✅ fait.

8. **Backlog** : [BACKLOG.md](BACKLOG.md) — BL-1 (céréales en tonnes, ticket 3 §2.2,
   ~1 j), BL-2 (suppression référentiel, ex-ticket 24 §2.2, ~1 j),
   BL-3 (ticket 25, pop-up partenaires, ~0,5 j).

## Dépendances clés

- **Ticket 6 = ticket 1** (doublon, corrigé).
- **Tickets 2 = 8** (même bloc paille, traiter ensemble).
- **Ticket 12** → impacte l'ordre du **ticket 13** (si `RT`).
- **Ticket 8** (ajout `STRAW`) → impacte l'ordre du **ticket 13**.
- **Ticket 1** (prérequis) → tickets 5, 8 (paille distribuable).
- **Ticket 14** ↔ **ticket 10** (valeurs pâture).
- **Ticket 7** couvre le TODO `SticModal.vue` (copie baguette entre années climatiques).

## Conventions d'implémentation (rappel)

- **Architecture verrouillée** : app quasi stateless côté serveur ; le workspace
  local + `workspace.json` sont fondamentaux. **Pas de backend/endpoint pour les
  cartes custom** (elles vivent dans `workspace.classicFeeds`).
- **Ids custom volatils** : dérivés à la volée par `mergeLists` ; référence par
  objet (deepEqual) ou `correspondingStock`, **jamais par id**.
- **Pas de commit** sans accord explicite de l'utilisateur.
- **Tests** : specs dans `tests/unit/vuex/*.spec.js`, fixture
  `tests/unit/vuex/fixtures/rootState.json`.
