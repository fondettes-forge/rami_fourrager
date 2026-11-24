// referential.spec.js
// Ticket 1 — Carte ration ajoutée introuvable (Troupeau\lot et Grange)
//
// Verrouille :
//   C1 : mergeLists robuste (liste référentielle vide, ids non consécutifs)
//   C3 : concentratedFeedList fusionne bien state.concentrated_feeds (pas feed_types)
//   C5 : couverture des getters de fusion + consommation d'une carte custom

import fs from 'fs'
import path from 'path'
import { getBatchConsumption } from '@/store/modules/mixins'

const stateFilePath = path.join(__dirname, 'fixtures/rootState.json')
const rootState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const customClassicFeed = {
  name: 'Foin Luzerne Brenne',
  correspondingStock: 'FH',
  nutritional_values: {
    UEL: 1.05,
    UEB: 1.2,
    UEM: 1.4,
    UFL: 0.6,
    PDI_inf: 60,
    UFV: 0.6,
    PDIN: 0,
    PDIE: 0,
    rejection: 0,
  },
}

const customConcentratedFeed = {
  name: 'Tourteau de colza custom',
  correspondingStock: 'RP',
  nutritional_values: {
    UEL: 0.85,
    UEB: 0.8,
    UEM: 0.8,
    UFL: 0.85,
    PDI_inf: 138,
    UFV: 0.8,
    PDIN: 219,
    PDIE: 138,
    rejection: 0,
  },
}

function buildReferentialState({ feedTypes = [], concentratedFeeds = [] } = {}) {
  return {
    referential: {
      feed_types: feedTypes,
      concentrated_feeds: concentratedFeeds,
    },
    workspace: {
      workspace: {
        classicFeeds: [customClassicFeed],
        concentratedFeeds: [customConcentratedFeed],
      },
    },
  }
}

function buildGetters(state) {
  // On importe le module du store pour accéder aux getters réels.
  // Les getters testés ne dépendent que de state + rootState (pas d'actions).
  // eslint-disable-next-line global-require
  const referentialModule = require('@/store/modules/referential').default
  return {
    classicFeedList: referentialModule.getters.classicFeedList(state.referential, {}, state, {}),
    concentratedFeedList: referentialModule.getters.concentratedFeedList(state.referential, {}, state, {}),
  }
}

// ---------------------------------------------------------------------------
// C1 — mergeLists via classicFeedList
// ---------------------------------------------------------------------------

describe('referential — classicFeedList (fusion référentiel + cartes custom)', () => {
  it('retourne la carte custom quand feed_types est vide (C1 : pas de TypeError)', () => {
    const state = buildReferentialState({ feedTypes: [] })
    const list = buildGetters(state).classicFeedList

    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Foin Luzerne Brenne')
    expect(list[0].correspondingStock).toBe('FH')
    // id négatif (pas d'ancrage référentiel)
    expect(list[0].id).toBe(-1)
  })

  it('concatène référentiels + cartes custom sans doublon d id (C1)', () => {
    const feedTypes = [
      { id: 1, name: 'Foin bonne qualité', correspondingStock: 'FH' },
      { id: 2, name: 'Foin moyenne qualité', correspondingStock: 'FH' },
    ]
    const state = buildReferentialState({ feedTypes })
    const list = buildGetters(state).classicFeedList

    expect(list).toHaveLength(3)
    // les ids référentiels sont conservés
    expect(list[0].id).toBe(1)
    expect(list[1].id).toBe(2)
    // la carte custom reçoit un id supérieur au max référentiel
    expect(list[2].id).toBe(3)
    expect(list[2].name).toBe('Foin Luzerne Brenne')

    // pas de doublon d id
    const ids = list.map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gère des ids référentiels non consécutifs (Math.max)', () => {
    const feedTypes = [
      { id: 10, name: 'A', correspondingStock: 'FH' },
      { id: 5, name: 'B', correspondingStock: 'EH' },
    ]
    const state = buildReferentialState({ feedTypes })
    const list = buildGetters(state).classicFeedList

    expect(list).toHaveLength(3)
    // id custom = max(10, 5) + 1 = 11
    expect(list[2].id).toBe(11)
  })

  it("ne modifie pas la liste référentielle d'origine (pas de mutation)", () => {
    const feedTypes = [{ id: 1, name: 'Foin bonne qualité', correspondingStock: 'FH' }]
    const state = buildReferentialState({ feedTypes })
    const before = JSON.parse(JSON.stringify(feedTypes))
    // le getter doit retourner la liste fusionnée sans muter l'originale
    const list = buildGetters(state).classicFeedList
    expect(list.length).toBeGreaterThan(0)

    expect(state.referential.feed_types).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// C3 — concentratedFeedList
// ---------------------------------------------------------------------------

describe('referential — concentratedFeedList (fix C3)', () => {
  it('retourne les concentrés custom quand concentrated_feeds est vide', () => {
    const state = buildReferentialState({ concentratedFeeds: [] })
    const list = buildGetters(state).concentratedFeedList

    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Tourteau de colza custom')
    expect(list[0].id).toBe(-1)
  })

  it('fusionne concentrated_feeds (et non feed_types) + custom (C3)', () => {
    const concentratedFeeds = [{ id: 100, name: 'Concentré céréales', correspondingStock: 'RC' }]
    const feedTypes = [{ id: 1, name: 'Foin bonne qualité', correspondingStock: 'FH' }]
    const state = buildReferentialState({ concentratedFeeds, feedTypes })
    const list = buildGetters(state).concentratedFeedList

    // doit contenir le concentré référentiel (id 100) ET le custom
    // et NE PAS contenir le feed_type (id 1, 'Foin bonne qualité')
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(100)
    expect(list[0].name).toBe('Concentré céréales')
    expect(list[1].id).toBe(101)
    expect(list[1].name).toBe('Tourteau de colza custom')

    const names = list.map((el) => el.name)
    expect(names).not.toContain('Foin bonne qualité')
  })
})

// ---------------------------------------------------------------------------
// C5 — garde-fou en aval : consommation d'une carte custom
// ---------------------------------------------------------------------------

describe('mixins — consommation d une carte ration custom (C5)', () => {
  it('getBatchConsumption compte la part d une carte custom (correspondingStock FH)', () => {
    const batchs = rootState.simulator.herd.batchs
    const batch = batchs[0]
    const periodId = batch.profile.animal_profile_periods[0].period_id

    // consommation de base (aliments du lot tel quel)
    const base = getBatchConsumption(batch, periodId, 'FH')

    // on distribue la carte custom sur la même période (en plus des aliments existants)
    const feedsForPeriod = batch.classicFeeds.find((item) => item.period.id === periodId).feeds
    const customType = {
      name: customClassicFeed.name,
      correspondingStock: customClassicFeed.correspondingStock,
      nutritional_values: customClassicFeed.nutritional_values,
    }
    const feedsWithCustom = [...Object.values(feedsForPeriod), { type: customType, proportion: 10 }]

    // getBatchConsumption lit batch.classicFeeds ; on injecte temporairement
    // la période modifiée puis on restaure.
    const originalFeeds = feedsForPeriod
    const cfIndex = batch.classicFeeds.findIndex((item) => item.period.id === periodId)
    batch.classicFeeds[cfIndex] = { ...batch.classicFeeds[cfIndex], feeds: feedsWithCustom }
    let withCustom
    try {
      withCustom = getBatchConsumption(batch, periodId, 'FH')
    } finally {
      batch.classicFeeds[cfIndex] = { ...batch.classicFeeds[cfIndex], feeds: originalFeeds }
    }

    // la carte custom (proportion 10) doit augmenter la consommation FH
    expect(withCustom).toBeGreaterThan(base)
  })
})
