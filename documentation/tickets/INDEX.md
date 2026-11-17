# Index des tickets — Rami liste (Antoine Savoie, 02/10/2026)

> Liste de référence : [Rami-liste-tickets.md](Rami-liste-tickets.md).
> Chaque ticket a une doc d'analyse/préco dédiée (`ticket-N-slug.md`).
> Travaux non traités : [BACKLOG.md](BACKLOG.md).
> Mise à jour : 2026-11-17.

## Légende statut

| Statut                      | Sens                                               |
| --------------------------- | -------------------------------------------------- |
| ✅ **Implémenté**           | code corrigé + tests, non commit (validé en local) |
| 📄 **Doc écrite**           | analyse/préco faite, à implémenter                 |
| 📄 **Doc écrite (doublon)** | doublon d'un autre ticket, corrigé via celui-ci    |
| ⏳ **À clarifier**          | en attente de décision (INRAE/équipe)              |
| ❌ **Non traité**           | ni doc, ni code                                    |

## Tableau de bord

| #   | Ticket                                                     | Type        | Priorité  | Statut                 | Doc                                                   | Dépendances / notes                                            |
| --- | ---------------------------------------------------------- | ----------- | --------- | ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Carte ration introuvable (Troupeau/Grange)                 | Bug         | Haute     | ✅ Implémenté          | [ticket-1](ticket-1-carte-ration-introuvable.md)      | — (ticket 6 en dépend)                                         |
| 2   | Paille non comptabilisée (STOCKS/COUTS)                    | Bug         | Haute     | 📄 Doc écrite          | [ticket-2](ticket-2-paille-stocks-couts.md)           | **= ticket 8** (même bloc paille)                              |
| 3   | Paille (et céréales) en tonnes                             | Correction  | Moyenne   | ✅ **Partiel** (2.1)   | [ticket-3](ticket-3-paille-cereales-tonnes.md)        | paille ✅ ; 2.2 céréales → [backlog BL-1](BACKLOG.md)          |
| 4   | Bouton « AJOUTER » Présence inutile                        | Correction  | Basse     | 📄 Doc écrite          | [ticket-4](ticket-4-bouton-ajouter-presence.md)       | —                                                              |
| 5   | Dupliquer / adapter une carte ration                       | Nouveauté   | Moyenne   | 📄 Doc écrite          | [ticket-5](ticket-5-dupliquer-carte-ration.md)        | dépend du ticket 1 (distribué)                                 |
| 6   | Cartes rations introuvables dans Troupeau                  | Bug         | Haute     | 📄 **Doublon du 1** ✅ | [ticket-6](ticket-6-carte-ration-troupeau.md)         | **= ticket 1** (fusionner)                                     |
| 7   | Décliner une baguette entre années climatiques             | Nouveauté   | Moyenne   | 📄 Doc écrite          | [ticket-7](ticket-7-baguette-annees-climatiques.md)   | bug latent B1 (climatic_year_id)                               |
| 8   | Aucune paille consommée (logement + alimentation)          | Bug         | Haute     | 📄 Doc écrite          | [ticket-8](ticket-8-paille-aucune-conso.md)           | **= ticket 2** (même bloc) ; dépend du 1 ; 100 % frontend      |
| 9   | Réordonner les onglets du Bilan                            | Correction  | Basse     | ✅ Implémenté          | [ticket-9](ticket-9-ordre-onglets-bilan.md)           | — (simple réordonnancement)                                    |
| 10  | Périodes vides (division par zéro ?)                       | Bug         | Moyenne   | 📄 Doc écrite          | [ticket-10](ticket-10-periodes-vides.md)              | affichage 0% vs vide ; lié 14                                  |
| 11  | Compteur de surface Assolement (+ retrait contraintes)     | Nouveauté   | Moyenne   | 📄 Doc écrite          | [ticket-11](ticket-11-compteur-surface-assolement.md) | bonus retrait contraintes à valider                            |
| 12  | Tourteaux absents de Stocks et Coûts                       | Nouveauté   | **Haute** | 📄 Doc écrite          | [ticket-12](ticket-12-tourteaux-stocks-couts.md)      | **Option 1 (RP) vs Option 2 (RT) à trancher** ; lié 13         |
| 13  | Réorganiser la liste de la Grange                          | Correction  | Basse     | ✅ Implémenté          | [ticket-13](ticket-13-reorganiser-grange.md)          | STRAW en fin (ticket 8) ; si ticket 12 Option 2 → insérer `RT` |
| 14  | Valeurs pâtures VL/VA                                      | À clarifier | Moyenne   | ⏳ **À clarifier**     | [ticket-14](ticket-14-valeurs-patuares-vl-va.md)      | **décision INRAE requise** avant code                          |
| 15  | AnimalProfileModal : batch_type + rafraîchissement profils | Bug         | Moyenne   | 📄 Doc écrite          | [ticket-15](ticket-15-animal-profile-batch-type.md)   | TODO `AnimalProfileModal.vue` L260                             |
| 16  | Export : nom obligatoire + colonnes manquantes             | Bug         | Moyenne   | 📄 Doc écrite          | [ticket-16](ticket-16-export-nom-colonnes.md)         | TODO `Export.vue` L141                                         |

## Synthèse

- **Implémenté** : 7/16 (tickets 1, 2+8 [bloc paille], 3 [2.1 paille en tonnes], 9 [onglets Bilan], 13 [Grange]) — le ticket 6 est le doublon du 1.
- **Docs écrites, prêtes à implémenter** : 12/16 (tickets 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15, 16).
- **À clarifier (décision requise)** : 1/16 (ticket 14) ; + à trancher : option 12 (1/2), bonus 11, option 2.2 du ticket 3 (céréales).

## Blocs de travail suggérés

1. **Bloc paille (tickets 2 + 8)** — le plus gros (~2,5 j), **100 % frontend**
   (`Rdt_paille` est déjà dans `Stic.rendement`, pas de backend). À traiter **de
   concert** (même code). Préréquis : ticket 1 (✅) et décision sur l'unité paille
   (ticket 3, 2.1).
2. **Bloc simple/rapide** :
   - ticket 4 (bouton Présence, à estimer) ;
   - ticket 11 (compteur surface, ~0,5 j).
     (tickets 9 ✅ et 13 ✅ faits)
3. **Ticket 12 (tourteaux)** — **à trancher** Option 1 (`RP`, rapide, CSV seul)
   vs Option 2 (`RT`, propre mais référentiel + migration). Option 1 est la
   plus rapide pour débloquer.
4. **Tickets UX** : ticket 5 (dupliquer carte, ~0,5 j), ticket 7 (décliner
   baguette, ~0,75 j), ticket 10 (périodes vides, ~1,5 j).
5. **Ticket 14** — en attente de réponse INRAE (aucun code avant décision).

- **Tickets TODO** : ticket 15 (AnimalProfileModal, ~0,75 j), ticket 16
  (Export, ~1,5 j).

7. **Backlog** : [BACKLOG.md](BACKLOG.md) — BL-1 (céréales en tonnes, ticket 3 §2.2,
   ~1 j, conversion 360° à valider).

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
