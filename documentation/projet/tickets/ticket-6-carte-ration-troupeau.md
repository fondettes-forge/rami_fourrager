# Ticket 6 — Cartes rations créées introuvables dans « Troupeau »

> Ticket source : [Rami-liste-tickets.md](Rami-liste-tickets.md) §6.
> Statut : **✅ corrigé (doublon du ticket 1)** · Priorité : **haute** · Type : bug
> Date de l'analyse : 2026-11-16

---

## 1. Analyse

### 1.1 Ce que dit la demande

> J'ai créé 2 cartes rations : [capture]. Mais je ne les retrouve pas dans
> « troupeau » : [capture].

### 1.2 C'est le ticket 1

Cette demande est **strictement identique** au ticket 1
([ticket-1-carte-ration-introuvable.md](ticket-1-carte-ration-introuvable.md))
côté Troupeau : les cartes rations créées dans *Mes configurations* ne
s'affichent pas dans le select « Ajouter un aliment » de
*Troupeau → lot → Aliments* (getters `classicFeedList` / `concentratedFeedList`
cassés par `mergeLists` sur liste référentielle vide + typo `state.feed_types`
dans `concentratedFeedList`).

Elle est conservée séparée car elle vient d'un **échange distinct** du mail
(demande §6 vs §1), mais la cause racine, le fix et les tests sont **les mêmes**.

---

## 2. Statut

**Corrigé** dans le ticket 1 :

- `mergeLists` rendu robuste (liste vide → ids négatifs, `Math.max` pour les ids,
  pas de mutation) — `store/modules/referential.js` ;
- typo `concentratedFeedList` corrigée (fusionne `state.concentrated_feeds` au
  lieu de `state.feed_types`) ;
- validation `correspondingStock` + `no-data-text` dans les modals ;
- tests unitaires `tests/unit/vuex/referential.spec.js` (9 tests).

➡️ **Fusionner le ticket 6 avec le ticket 1** (un seul ticket, deux sources).

---

## 3. Critères d'acceptation

Mêmes que le ticket 1 §4 :

1. Les 2 cartes créées apparaissent dans le select « Aliments » du Troupeau,
   **même si la liste référentielle est vide**.
2. Les tests unitaires de fusion passent.

## 4. Estimation

**0 j** (doublon du ticket 1, déjà implémenté).
