# Index des devis — Rami (Antoine Savoie / INRAE)

> **Objectif** : correspondance **devis ↔ tickets** pour chaque devis du
> dossier `devis_en_attente/`. Chaque ligne d'un devis pointe le ticket qui le
> couvre (ou est signalée comme **fait hors devis** / **pas de ticket**).
>
> Source : `../demandes/tache rami en devis.ods` (colonne « devis » + « facture »)
>
> - [mapping-devis-tickets.md](../tickets/mapping-devis-tickets.md) +
>   [INDEX.md (tickets)](../tickets/INDEX.md).
>   Date de mise à jour : 2026-11-19.
>
> **Légende statut ticket** : ✅ implémenté · 📄 doc écrite (à implémenter) ·
> ⏳ à clarifier · ❌ non traité.

## Synthèse des devis

### Devis d'origine (2025) — non modifiés

| Réf. devis       | Intitulé de mission                        | Total (€) | Statut facturation          | Tickets associés          |
| ---------------- | ------------------------------------------ | --------- | --------------------------- | ------------------------- |
| **#2025081801D** | Rami fourrager (correctifs)                | 450       | ✅ **passé en facturation** | — (4 items « fait = ok ») |
| **#2025081802D** | Rami fourrager (améliorations)             | 400       | 📄 en attente               | 17, 18, 19                |
| **#2025081803D** | Rami fourrager — Gestion des « sites »     | 800       | 📄 en attente               | 20                        |
| **#2025081804D** | Rami fourrager — Duplication de simulation | 400       | 📄 en attente               | 21                        |
| **#2025081805D** | Rami fourrager — Page « Partenaires »      | 400       | 📄 en attente               | 25                        |

### Devis à tickets (2026) — complètent les devis d'origine avec la colonne « Ticket »

| Réf. devis       | Fichier                                                                                                               | Intitulé                       | Total (€) | Tickets    | Base    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------- | ---------- | ------- |
| **#2026111901D** | [2026111901D_..._ameliorations_tickets.docx](2026111901D_devis_Antoine_Savoie_inrae_ameliorations_tickets.docx)       | Rami fourrager (améliorations) | 400       | 17, 18, 19 | 02D     |
| **#2026111902D** | [2026111902D_..._sites_tickets.docx](2026111902D_devis_Antoine_Savoie_inrae_evolution_sites_tickets.docx)             | Gestion des « sites »          | 800       | 20         | 03D     |
| **#2026111903D** | [2026111903D_..._simulation_tickets.docx](2026111903D_devis_Antoine_Savoie_inrae_evolution_simulation_tickets.docx)   | Duplication de simulation      | 400       | 21         | 04D     |
| **#2026111904D** | [2026111904D_..._partenaires_tickets.docx](2026111904D_devis_Antoine_Savoie_inrae_evolution_partenaires_tickets.docx) | Page « Partenaires »           | 400       | 25         | 05D     |
| **#2026111905D** | [2026111905D_..._hors_devis_tickets.docx](2026111905D_devis_Antoine_Savoie_inrae_hors_devis_tickets.docx)             | Divers (hors devis numéroté)   | 800       | 22, 23, 24 | nouveau |

> **2026-11-23** : périmètre du ticket 24 réduit (suppression référentiel →
> backlog [BL-2](../tickets/BACKLOG.md)) : devis 05D 1 200 € → **800 €** (24 :
> 16 h → 8 h). Ticket 25 entièrement au backlog ([BL-3](../tickets/BACKLOG.md)) :
> le devis 04D est conservé, exécution suspendue.

---

## Devis #2025081801D — Rami fourrager (correctifs) — 450 €

> **Statut** : ✅ **passé en facturation** (colonne « facture » = « en attente »
> dans le .ods). Les 4 items sont marqués **fait = ok** → **pas de ticket**.

| Tâche (libellé devis)                                                                           | Durée | Prix (€) | « fait » | Ticket | Statut             |
| ----------------------------------------------------------------------------------------------- | ----- | -------- | -------- | ------ | ------------------ |
| Correction du calcul pour la couverture des besoins par les fourrages                           | 3 h   | 150      | ok       | —      | ✅ fait hors devis |
| Correction du calcul dans les concentrés en lien avec calcul de la couverture par les fourrages | 2 h   | 100      | ok       | —      | ✅ fait hors devis |
| Correction du problème d'affichage des concentrés                                               | 2 h   | 100      | ok       | —      | ✅ fait hors devis |
| Correction du calcul d'assolement                                                               | 2 h   | 100      | ok       | —      | ✅ fait hors devis |

> **Lignes .ods** : 4 (couverture), 5 (concentrés), 6 (assolement), 7 (bouton
> « modifier » stock Grange). Les 4 lignes sont marquées « ok » → **aucun
> ticket**.

---

## Devis #2025081802D — Rami fourrager (améliorations) — 400 €

| Tâche (libellé devis)                                                                              | Durée | Prix (€) | « fait » | Ticket                                               | Statut             |
| -------------------------------------------------------------------------------------------------- | ----- | -------- | -------- | ---------------------------------------------------- | ------------------ |
| Ajout d'un logo facultatif/obligatoire sur les champs des formulaires baguettes et profils animaux | 4 h   | 200      | —        | [17](../tickets/ticket-17-validation-formulaires.md) | 📄 à implémenter   |
| Ajout d'une info-bulle explicative spécifique génisse                                              | 1 h   | 50       | —        | [18](../tickets/ticket-18-tooltip-genisses.md)       | ✅ implémenté      |
| Ajout du graphique « pâture verte disponible et besoin du troupeau » dans le module assolement     | 2 h   | 100      | —        | [19](../tickets/ticket-19-graph-pature-verte.md)     | 📄 à implémenter   |
| Modification des textes de traductions                                                             | 1 h   | 50       | ok       | —                                                    | ✅ fait hors devis |

> **Lignes .ods** : 9 (champs facultatifs/obligatoires → **ticket 17**),
> 10 (info-bulle génisse → **ticket 18**), 11 (graphique pâture verte →
> **ticket 19**), 12 + 14–23 (traductions → **fait ok**, pas de ticket).

---

## Devis #2025081803D — Rami fourrager — Gestion des « sites » (évolution) — 800 €

| Tâche (libellé devis)                                                                                          | Durée | Prix (€) | « fait » | Ticket                                      | Statut           |
| -------------------------------------------------------------------------------------------------------------- | ----- | -------- | -------- | ------------------------------------------- | ---------------- |
| Ajout de formulaires de création, de mise à jour et de suppression de site dans le tableau de bord utilisateur | 14 h  | 700      | —        | [20](../tickets/ticket-20-gestion-sites.md) | 📄 à implémenter |
| Tests                                                                                                          | 2 h   | 100      | —        | (couvert par le ticket 20)                  | 📄 à implémenter |

> **Ligne .ods** : 26 (formulaire site + années climatiques → **ticket 20**).
> Triptyque site → année climatique → baguette ; backend + frontend.

---

## Devis #2025081804D — Rami fourrager — Duplication de simulation (évolution) — 400 €

| Tâche (libellé devis)                                                                          | Durée | Prix (€) | « fait » | Ticket                                               | Statut           |
| ---------------------------------------------------------------------------------------------- | ----- | -------- | -------- | ---------------------------------------------------- | ---------------- |
| Ajout de la fonctionnalité de duplication d'une simulation dans le tableau de bord utilisateur | 7 h   | 350      | —        | [21](../tickets/ticket-21-duplication-simulation.md) | 📄 à implémenter |
| Tests                                                                                          | 1 h   | 50       | —        | (couvert par le ticket 21)                           | 📄 à implémenter |

> **Ligne .ods** : 28 (duplication de simulation « Enregistrer-sous » →
> **ticket 21**).

---

## Devis #2025081805D — Rami fourrager — Page « Partenaires » (évolution) — 400 €

> **2026-11-23** : ticket 25 entièrement déplacé au backlog
> ([BL-3](../tickets/BACKLOG.md)) — exécution du devis suspendue, à trancher.

| Tâche (libellé devis)                                                   | Durée | Prix (€) | « fait » | Ticket                                         | Statut               |
| ----------------------------------------------------------------------- | ----- | -------- | -------- | ---------------------------------------------- | -------------------- |
| Création d'une page « Partenaires » avec tous les logos institutionnels | 7 h   | 350      | —        | [25](../tickets/ticket-25-page-partenaires.md) | ⏳ au backlog (BL-3) |
| Tests                                                                   | 1 h   | 50       | —        | (couvert par le ticket 25)                     | ⏳ au backlog (BL-3) |

> **Ligne .ods** : 30 (page des partenaires — pop-up avec tous les logos →
> **ticket 25**). `PartnersPage.vue` existe déjà avec tous les logos ; ce qui
> manque est le **mode pop-up**.

---

## Items hors devis numéroté (bas du tableau .ods)

> Ces items n'appartiennent pas à un devis 2025 (01D–05D). Ils sont couverts
> par le **devis #2026111905D** (voir tableau ci-dessus).

| Ligne .ods | Item (résumé)                                                                                             | « fait » | Ticket                                             | Statut                 | Devis 2026 |
| ---------- | --------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- | ---------------------- | ---------- |
| 32         | Ajouter une colonne « source » pour les baguettes                                                         | —        | [22](../tickets/ticket-22-source-baguettes.md)     | 📄 à implémenter       | 05D        |
| 34         | Pouvoir créer des baguettes d'un site sur un autre site (+ griser champs recherche)                       | ok       | —                                                  | ✅ fait hors devis     | —          |
| 37         | Formulaire login : rien ne se passe si erreur / user inexistant                                           | —        | [23](../tickets/ticket-23-feedback-login.md)       | 📄 à implémenter       | 05D        |
| 39         | Gestion de métadonnées de toutes les informations du référentiel (+ champ résumé baguette, doc injecteur) | —        | [24](../tickets/ticket-24-metadata-referentiel.md) | 📄 à implémenter (8 h) | 05D        |

> **2026-11-23** : la **suppression** du référentiel (ticket 24 §2.2) est retirée
> du devis 05D → backlog [BL-2](../tickets/BACKLOG.md). Ticket 24 : 16 h → 8 h,
> 800 € → 400 €. Devis 05D : 1 200 € → **800 €**.

---

## Récapitulatif par ticket

| Ticket                                               | Titre                                                             | Devis 2025 | Devis 2026 | Ligne .ods | Statut   |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ---------- | ---------- | -------- |
| [17](../tickets/ticket-17-validation-formulaires.md) | Validation formulaires : champs facultatifs/obligatoires          | 02D        | 01D        | 9          | 📄       |
| [18](../tickets/ticket-18-tooltip-genisses.md)       | Tooltip « nb génisses à garder »                                  | 02D        | 01D        | 10         | ✅       |
| [19](../tickets/ticket-19-graph-pature-verte.md)     | Graphique « pâture verte disponible et besoin du troupeau »       | 02D        | 01D        | 11         | 📄       |
| [20](../tickets/ticket-20-gestion-sites.md)          | Formulaire gestion sites (création/màj/supp + années climatiques) | 03D        | 02D        | 26         | 📄       |
| [21](../tickets/ticket-21-duplication-simulation.md) | Duplication de simulation (« Enregistrer-sous »)                  | 04D        | 03D        | 28         | 📄       |
| [22](../tickets/ticket-22-source-baguettes.md)       | Colonne « source » pour les baguettes                             | —          | 05D        | 32         | 📄       |
| [23](../tickets/ticket-23-feedback-login.md)         | Feedback login (erreur / user inexistant)                         | —          | 05D        | 37         | 📄       |
| [24](../tickets/ticket-24-metadata-referentiel.md)   | Métadonnées référentiel (résumé baguette + doc injecteur)         | —          | 05D        | 39         | 📄 (8 h) |
| [25](../tickets/ticket-25-page-partenaires.md)       | Page des partenaires : mode pop-up logos                          | 05D        | 04D        | 30         | ⏳ BL-3  |

> **Backlog** : [BL-1](../tickets/BACKLOG.md) (céréales en tonnes),
> [BL-2](../tickets/BACKLOG.md) (suppression référentiel, ex-ticket 24 §2.2),
> [BL-3](../tickets/BACKLOG.md) (ticket 25, page partenaires en pop-up).

> **Tickets du mail oct. 2026 (1–16)** : pas dans les devis 2025 (le mail est
> postérieur). Voir [mapping-devis-tickets.md](../tickets/mapping-devis-tickets.md)
> § E et [INDEX.md (tickets)](../tickets/INDEX.md).

---

## Prochaines étapes suggérées

1. **Valider** les 5 devis 2026 (#2026111901D à #2026111905D) avec Antoine.
2. **Confirmer** que le devis **01D (2025)** est bien **facturé** et le
   marquer comme tel dans le .ods.
3. **Prioriser** les tickets des devis 2026 :
   - **Fonctionnalités à forte valeur** : 20 (sites, 02D), 21 (duplication,
     03D), 24 (métadonnées, 05D).
   - **UX rapides** : 17 (validation, 01D), 19 (graph pâture, 01D).
   - **Bug utilisateur** : 23 (feedback login, 05D).
   - **Au backlog** : 25 (pop-up partenaires, BL-3) ; suppression référentiel
     (BL-2).
4. **Recette** : vérifier que les items « fait = ok » sont bien dans le code
   actuel.
