# Ticket 25 — Page des partenaires : mode pop-up logos

> Ticket source : [mapping-devis-tickets.md](../mapping-devis-tickets.md) —
> devis 2025, ligne 30 (`2025081805D_devis_Antoine_Savoie_inrae_evolution_partenaires`).
> Provenance : **Devis 2025** (page des partenaires).
> Statut : **à traiter** · Priorité : **moyenne** · Type : correction / UX
> Date de l'analyse : 2026-11-18

---

## 1. Analyse

### 1.1 Ce que dit la demande

> Ajouter le pop-up avec tous les logos.

Devis : 1 jour.

### 1.2 Ce qui est déjà en place

- `views/PartnersPage.vue` **existe** : page route dédiée affichant **tous les
  logos** du projet (12 logos répartis en 5 blocs : financeurs interface,
  partenaires du projet, développement, partenaires scientifiques, autres
  financeurs), avec textes i18n (`partners.interface_funded_by`,
  `partners.project_partners`, `partners.development_supported_by`).
- Les images sont dans `assets/images/partners/` (`logo_centrevaldeloire.jpg`,
  `logoIdeleRect.jpg`, `logo_inrae_bloc.jpg`, `logoIdele.png`,
  `logo_cap2er.png`, `PraiCos.png`, `toulouseAgriCampus.jpg`,
  `midi_pyrenees.jpg`, `MASA_casdar.png`, `PSDR3.png`, `europe.jpg`,
  `logo-anr.gif`, `logo_centrevaldeloire2.png`).

### 1.3 Ce qui manque

La demande est d'avoir les logos en **pop-up** — or la page partenaires est
actuellement une **page route à part entière**. À vérifier dans le code :

- est-ce que le lien vers `PartnersPage` existe dans la navigation
  (menu/bandeau) ?
- l'attendu du devis est probablement un **bouton/lien discret** (ex. icône
  partenaires dans le footer ou le menu) qui **ouvre un modal** contenant les
  logos, sans quitter la page courante.

---

## 2. Recommandations

### 2.1 Périmètre minimal (recommandé, ~0,5 j)

1. Créer `components/partners/PartnersModal.vue` :
   - wrapper `v-dialog` (large, scrollable) contenant le contenu de
     `PartnersPage.vue` (extrait du template, ou extraction du bloc logos dans
     un composant partagé `PartnersLogos.vue` utilisé par la page ET le modal) ;
2. Ajouter le déclencheur dans le layout principal (footer ou menu, à décider
   avec Antoine) : bouton/icône « Partenaires » qui ouvre le modal ;
3. Conserver `PartnersPage.vue` (route) ou la supprimer si le modal suffit —
   **à trancher avec Antoine** (si des liens externes pointent sur la route,
   la garder).

### 2.2 À vérifier pendant l'implémentation

- Où est déclaré le route partenaire (router) et quel lien existe-t-il
  actuellement dans la UI ;
- si le modal doit être accessible **avant login** (page login) — probable,
  puisque les logos des financeurs concernent aussi la page publique.

---

## 3. Fichiers impactés (récap)

| Fichier | Changement |
|---------|-----------|
| `services/frontend/ui/src/components/partners/PartnersLogos.vue` (nouveau) | contenu logos extrait (partagé page/modal) |
| `services/frontend/ui/src/components/partners/PartnersModal.vue` (nouveau) | `v-dialog` + `PartnersLogos` |
| `services/frontend/ui/src/views/PartnersPage.vue` | utiliser `PartnersLogos` (refacto) |
| layout principal (footer/menu, à identifier) | bouton déclencheur du modal |
| `src/locales/fr.json` | libellé bouton « Partenaires » si absent |

---

## 4. Critères d'acceptation

1. Un bouton/lien « Partenaires » est visible dans la navigation (footer ou
   menu, y compris avant login).
2. Au clic, un **pop-up** s'ouvre et affiche tous les logos du projet
   (mêmes logos que la page actuelle).
3. Le modal se ferme proprement (croix + clic extérieur).
4. La page `PartnersPage` continue de fonctionner si la route est conservée.

## 5. Risques / points d'attention

- **Localisation du déclencheur** (footer, menu, page login) : à valider avec
  Antoine — la doc ne précise pas où.
- **Route existante** : si des liens externes (site web, e-mails) pointent sur
  la route partenaires, ne pas la supprimer.

## 6. Estimation

| Bloc | Effort |
|------|--------|
| Composant modal + extraction logos | ~0,25 j |
| Déclencheur dans le layout + i18n | ~0,25 j |
| **Total** | **~0,5 j** (le devis prévoyait 1 j) |
