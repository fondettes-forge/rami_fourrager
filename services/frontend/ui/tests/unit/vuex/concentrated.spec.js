// concentrated.spec.js
// Ticket 12 — Concentrés : tourteaux absents de Stocks et Coûts (Option 2 — code RT)
//
// Verrouille :
//   - RT présent dans barnStockItems (qtx, concentrated) — après RP, avant AS
//   - getBatchConcentratedConsumption compte la part d'un concentré RT
//   - getConcentratedFeedsStock renvoie une ligne RT (catégorie 2_concentrated)
//   - initialStocks (barn) n'inclut pas RT (saisi dans le champ dédié)
//   - soldedStock.RT initialisé (pas de crash sur les coûts)
//   - régression : RC et RP continuent de remonter, sans mélange avec RT

import { getBatchConcentratedConsumption, getConsumptionByBarnStockItem } from '@/store/modules/mixins'

// eslint-disable-next-line global-require
const referentialModule = require('@/store/modules/referential').default
// eslint-disable-next-line global-require
const reportModule = require('@/store/modules/report').default
// eslint-disable-next-line global-require
const barnModule = require('@/store/modules/barn').default

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const tourteauType = {
  name: 'Tourteau de colza',
  correspondingStock: 'RT',
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

// un lot minimal : concentré RT distribué sur la période 1
function makeBatch() {
  return {
    concentratedFeeds: [
      {
        period: { id: 1 },
        feeds: {
          0: { type: tourteauType, quantity: 0.35 },
        },
      },
    ],
    housing: {
      presence: [{ animalCount: 10 }],
    },
  }
}

// ---------------------------------------------------------------------------
// 1 — RT dans barnStockItems
// ---------------------------------------------------------------------------

describe('ticket 12 — RT dans barnStockItems', () => {
  const items = referentialModule.state.barnStockItems
  const byCode = Object.fromEntries(items.map((el) => [el.code, el]))

  it('contient RT (qtx, concentrated)', () => {
    expect(byCode.RT).toBeDefined()
    expect(byCode.RT.name).toBe('Tourteaux')
    expect(byCode.RT.unity).toBe('qtx')
    expect(byCode.RT.concentrated).toBe(true)
  })

  it('est positionné après RP et avant AS (ordre ticket 13 mis à jour)', () => {
    const order = items.map((el) => el.code)
    const iRC = order.indexOf('RC')
    const iRP = order.indexOf('RP')
    const iRT = order.indexOf('RT')
    const iAS = order.indexOf('AS')
    expect(iRC).toBeLessThan(iRP)
    expect(iRP).toBeLessThan(iRT)
    expect(iRT).toBeLessThan(iAS)
  })
})

// ---------------------------------------------------------------------------
// 2 — Consommation RT (mixins)
// ---------------------------------------------------------------------------

describe('ticket 12 — consommation RT (mixins)', () => {
  it('getBatchConcentratedConsumption compte la part d un concentré RT', () => {
    const batch = makeBatch()
    expect(getBatchConcentratedConsumption(batch, 1, 'RT')).toBeCloseTo(0.35)
  })

  it('ne compte pas RT dans RC / RP (pas de mélange)', () => {
    const batch = makeBatch()
    expect(getBatchConcentratedConsumption(batch, 1, 'RC')).toBe(0)
    expect(getBatchConcentratedConsumption(batch, 1, 'RP')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 3 — getConcentratedFeedsStock (report) : ligne RT
// ---------------------------------------------------------------------------

describe('ticket 12 — getConcentratedFeedsStock (report)', () => {
  it('renvoie une ligne RT non nulle (catégorie 2_concentrated) et RC/RP à 0', () => {
    const batch = makeBatch()
    const periods = [{ id: 1 }]

    const rootState = {
      referential: {
        periods,
        barnStockItems: referentialModule.state.barnStockItems,
      },
      simulator: {
        farm: { rotations: [{}] },
        herd: { batchs: [batch] },
        barn: { initialStocks: [], stockByPeriod: {} },
      },
    }
    // getSticByName : pas de stic → production 0
    const rootGetters = { 'referential/getSticByName': () => null }

    const stock = reportModule.getters.getConcentratedFeedsStock(reportModule.state, {}, rootState, rootGetters)

    const rt = stock.find((el) => el.code === 'RT')
    expect(rt).toBeDefined()
    expect(rt.category).toBe('2_concentrated')
    expect(rt.name).toBe('Tourteaux')
    // 0.35 kg/an/j × 10 animaux × nb jours période → > 0
    expect(rt.consommation).toBeGreaterThan(0)

    // RC et RP sont présents (stockCodeList) mais à 0 (aucun concentré RC/RP)
    const rc = stock.find((el) => el.code === 'RC')
    const rp = stock.find((el) => el.code === 'RP')
    expect(rc).toBeDefined()
    expect(rp).toBeDefined()
    expect(rc.consommation).toBe(0)
    expect(rp.consommation).toBe(0)
  })

  it('soldedStock.RT est initialisé (pas de crash sur les coûts)', () => {
    expect(reportModule.state.soldedStock.RT).toEqual({
      purchaseCost: 0,
      sale: 0,
      costOfSell: 0,
      productionCost: 0,
    })
  })
})

// ---------------------------------------------------------------------------
// 4 — getConsumptionByBarnStockItem : case RT
// ---------------------------------------------------------------------------

describe('ticket 12 — getConsumptionByBarnStockItem (case RT)', () => {
  it('renvoie la consommation concentrée pour RT', () => {
    const batch = makeBatch()
    const simulation = { herd: { batchs: [batch] } }
    const periods = [{ id: 1 }]

    // RT > 0 (concentré distribué)
    expect(getConsumptionByBarnStockItem(simulation, periods, 'RT')).toBeGreaterThan(0)
    // RC = 0 (aucun concentré RC)
    expect(getConsumptionByBarnStockItem(simulation, periods, 'RC')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 5 — initialStocks (barn) : RT exclu
// ---------------------------------------------------------------------------

describe('ticket 12 — initialStocks (barn) exclut RT', () => {
  it('filtre RT (comme STRAW, RC, RP) de la table générique des stocks', () => {
    const state = {
      initialStocks: [
        { code: 'FH', name: 'Foin', quantity: 100 },
        { code: 'RC', name: 'Céréales en grain', quantity: 10 },
        { code: 'RP', name: 'Protéagineux en grain', quantity: 5 },
        { code: 'RT', name: 'Tourteaux', quantity: 7 },
        { code: 'STRAW', name: 'Paille', quantity: 50 },
        { code: 'AS', name: 'autre stock', quantity: 1 },
      ],
    }
    const codes = barnModule.getters.initialStocks(state).map((el) => el.code)
    expect(codes).not.toContain('RT')
    expect(codes).not.toContain('RC')
    expect(codes).not.toContain('RP')
    expect(codes).not.toContain('STRAW')
    // les stocks fourragers restent affichés
    expect(codes).toContain('FH')
    expect(codes).toContain('AS')
  })
})
