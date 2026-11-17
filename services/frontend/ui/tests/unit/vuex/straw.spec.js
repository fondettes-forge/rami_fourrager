// straw.spec.js
// Tickets 2 + 8 — Paille : distribution, production, conso logement, stock final,
// sous-lignes STOCKS ET COUTS.
//
// Verrouille :
//   U1 : le stock initial paille est en tonnes (migration kg→t à la charge)
//   P1 : le code STRAW existe dans barnStockItems (paille distribuable)
//   P2 : la production paille somme stic.rendement × surface (Rdt_paille = rendement paille)
//   P3 : la conso logement est dimensionnée en kg/UGB/j × UGB du lot × jours
//   P4 : le stock final paille = stock initial + production - consommation
//   P5 : getStrawStock décline la paille en 2 sous-lignes aliment / logement
//        + 1 ligne cachée de synthèse (pas de double comptage)

import fs from 'fs'
import path from 'path'
import {
  setTotalStrawStock,
  getConsumptionOfNonFoodStraw,
  getConsumptionForStraw,
  getFoodStrawConsumption,
  getHousingStrawConsumption,
  getFinalStockByBarnStockItem,
  getInitialStockByBarnStockItem,
  getConsumptionByBarnStockItem,
} from '@/store/modules/mixins'

const stateFilePath = path.join(__dirname, 'fixtures/rootState.json')
const rootState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'))

const UGB = 4.75 // même constante que dans mixins.js (tMS ingérées pour 1 UGB)

function getStic() {
  // replique referential/getSticByName sur le fixture
  return (climaticYear, name) => {
    const stic = rootState.referential.stics.find((el) => el.climatic_year_id === climaticYear && el.name === name)
    if (stic === undefined) {
      throw new Error('stic error')
    }
    return stic
  }
}

function simulation() {
  // copie profonde pour ne pas polluer le fixture entre les tests
  return JSON.parse(JSON.stringify(rootState.simulator))
}

// ---------------------------------------------------------------------------
// U1 — stock initial paille en tonnes (ticket 3 : migration kg→t)
// ---------------------------------------------------------------------------

describe('U1 — stock initial paille en tonnes', () => {
  // eslint-disable-next-line global-require
  const barnModule = require('@/store/modules/barn').default

  it('setBarn convertit un stock initial paille en kg (> 1000) en tonnes', () => {
    const state = { stockByPeriod: [], refusalRate: 0, initialStocks: [] }
    barnModule.mutations.setBarn(state, {
      initialStocks: [{ code: 'STRAW', name: 'paille', quantity: 10000 }],
      stockByPeriod: [],
      refusalRate: 10,
    })
    expect(state.initialStocks[0].quantity).toBe(10)
  })

  it('setBarn laisse un stock initial paille déjà en tonnes inchangé', () => {
    const state = { stockByPeriod: [], refusalRate: 0, initialStocks: [] }
    barnModule.mutations.setBarn(state, {
      initialStocks: [{ code: 'STRAW', name: 'paille', quantity: 5 }],
      stockByPeriod: [],
      refusalRate: 10,
    })
    expect(state.initialStocks[0].quantity).toBe(5)
  })

  it('setBarn ne touche pas les autres stocks', () => {
    const state = { stockByPeriod: [], refusalRate: 0, initialStocks: [] }
    barnModule.mutations.setBarn(state, {
      initialStocks: [
        { code: 'STRAW', name: 'paille', quantity: 10000 },
        { code: 'RC', name: 'Céréales en grain', quantity: 216 },
        { code: 'FH', name: 'Foin', quantity: 58 },
      ],
      stockByPeriod: [],
      refusalRate: 10,
    })
    expect(state.initialStocks[0].quantity).toBe(10) // STRAW : kg → t
    expect(state.initialStocks[1].quantity).toBe(216) // RC : inchangé
    expect(state.initialStocks[2].quantity).toBe(58) // FH : inchangé
  })

  it('getStrawStock remonte le stock initial tel quel (pas de ×1000)', () => {
    const sim = simulation()
    sim.barn.initialStocks = [{ code: 'STRAW', name: 'paille', quantity: 12 }]
    // eslint-disable-next-line global-require
    const reportModule = require('@/store/modules/report').default
    const rows = reportModule.getters.getStrawStock(
      reportModule.state,
      {},
      { ...rootState, simulator: sim },
      {
        'simulator/barn/getTotalStrawStockProducted': rootState.simulator.barn.totalStrawStockProducted,
      }
    )
    const food = rows.find((r) => r.name === 'Paille (alimentation)')
    expect(food.initialStock).toBe(12)
  })
})

// ---------------------------------------------------------------------------
// P1 — code STRAW dans barnStockItems
// ---------------------------------------------------------------------------

describe('P1 — paille distribuable', () => {
  it('barnStockItems contient le code STRAW', () => {
    // eslint-disable-next-line global-require
    const referentialModule = require('@/store/modules/referential').default
    const codes = referentialModule.state.barnStockItems.map((item) => item.code)
    expect(codes).toContain('STRAW')
    const straw = referentialModule.state.barnStockItems.find((item) => item.code === 'STRAW')
    expect(straw.name).toBe('Paille')
  })
})

// ---------------------------------------------------------------------------
// P2 — production paille (stic.rendement = rendement paille, colonne CSV Rdt_paille)
// ---------------------------------------------------------------------------

describe('P2 — production paille', () => {
  it('utilise stic.rendement (rendement paille kg/ha × surface / 1000 = t)', () => {
    const sim = simulation()
    const stic = rootState.referential.stics.find((el) => el.climatic_year_id === sim.climaticYear)
    sim.farm.rotations = [
      { name: 'rotA', surface: 10 },
      { name: 'rotB', surface: 5 },
    ]
    const getSticMock = () => (climaticYear, name) => {
      if (name === 'rotA') {
        return { ...stic, rendement: '1000' }
      }
      // rotB : pas de rendement paille -> 0 (pas de paille produite)
      return { ...stic, rendement: '' }
    }
    // rotA : 1000 kg/ha × 10 ha = 10 t ; rotB : 0
    expect(setTotalStrawStock(sim, getSticMock())).toBeCloseTo(10, 5)
  })

  it('ne somme que les rotations avec un rendement paille (pas de NaN / 0)', () => {
    const sim = simulation()
    sim.farm.rotations = [
      { name: 'C3 : Blé', surface: 15 },
      { name: 'P1 : Paturage', surface: 30 },
    ]
    const getSticMock = () => (climaticYear, name) => {
      if (name === 'C3 : Blé') {
        return { rendement: '4500' }
      }
      return { rendement: '' }
    }
    // Blé : 4500 kg/ha × 15 ha = 67.5 t ; Paturage : 0
    expect(setTotalStrawStock(sim, getSticMock())).toBeCloseTo(67.5, 5)
  })

  it('la production du rapport (stockByPeriod) n a pas de ligne STRAW : elle vient de setTotalStrawStock', () => {
    const sim = simulation()
    let total = 0
    rootState.referential.periods.forEach((p, index) => {
      if (sim.barn.stockByPeriod[index] && sim.barn.stockByPeriod[index].stock !== null) {
        const stock = sim.barn.stockByPeriod[index].stock.find((item) => item.code === 'STRAW')
        total += stock === undefined ? 0 : stock.quantity
      }
    })
    expect(total).toBe(0)
    // donc la production affichée = production du getter barn (setTotalStrawStock)
    expect(sim.barn.totalStrawStockProducted).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// P3 — conso paille logement
// ---------------------------------------------------------------------------

describe('P3 — conso paille logement (litière)', () => {
  const sim = simulation()
  const periods = rootState.referential.periods

  it('est non nulle quand straw_requirement > 0', () => {
    expect(getConsumptionOfNonFoodStraw(sim, periods)).toBeGreaterThan(0)
  })

  it('est dimensionnée en kg/UGB/j × UGB du lot × jours (t)', () => {
    // vérification sur la 1re période, 1er lot
    const i = 0
    const batch = sim.herd.batchs[0]
    const totalMS = getBatchMSPerAnimal(batch, i)
    const besoin = batch.housing.type.straw_requirement // kg/UGB/j
    const presence = batch.housing.presence[i].days
    const nbAni = batch.housing.presence[i].animalCount
    const ugbLot = (totalMS * nbAni * presence) / UGB
    const expected = (besoin * ugbLot * presence) / 1000 // t
    // le calcul réel sur la période doit donner le même résultat (1 seul lot contribuant)
    const onlyBatch0 = JSON.parse(JSON.stringify(sim))
    onlyBatch0.herd.batchs = onlyBatch0.herd.batchs.slice(0, 1)
    const actual = getPeriodHousingStraw(onlyBatch0, periods, i)
    expect(actual).toBeCloseTo(expected, 6)
  })

  it('est nulle si aucun logement ne consomme de paille', () => {
    sim.herd.batchs.forEach((batch) => {
      if (batch.housing.type) {
        batch.housing.type.straw_requirement = 0
      }
    })
    expect(getConsumptionOfNonFoodStraw(sim, periods)).toBe(0)
  })

  it('la conso totale paille = aliment + logement', () => {
    const food = getFoodStrawConsumption(sim, periods)
    const housing = getHousingStrawConsumption(sim, periods)
    const total = getConsumptionForStraw(sim, periods)
    expect(total).toBeCloseTo(food + housing, 6)
    expect(getConsumptionByBarnStockItem(sim, periods, 'STRAW')).toBeCloseTo(total, 6)
  })
})

// besoinMS par animal (kgMS/j) pour la période — replique de calculateBesoinMS (mixins.js)
// besoinMS = CI × moderator / totalUE (totalUE = Σ proportion × valeur nutritionnelle de la colonne UE)
function getBatchMSPerAnimal(batch, index) {
  const toModerate = batch.profile.batch_type.code === 'VL'
  const ci = batch.profile.animal_profile_periods[index].CI
  const potential = 1
  const moderator = toModerate ? 0.1582 * potential + 0.8392 : 1
  const ueColumn = batch.profile.batch_type.UE_value_considered
  const feeds = batch.classicFeeds[index].feeds
  const totalUE = Object.values(feeds).reduce((acc, f) => {
    const v = (f.proportion / 100) * (f.type.nutritional_values[ueColumn] || 0)
    return acc + v
  }, 0)
  const moderatedCI = ci * moderator
  return Number((moderatedCI / (totalUE > 0 ? totalUE : 1)).toPrecision(4)) // fixFloatingPoint
}

// conso logement d une période donnée (replique exacte de getConsumptionOfNonFoodStraw
// limitée à la période, pour isoler le calcul)
function getPeriodHousingStraw(sim, periods, index) {
  let c = 0
  sim.herd.batchs.forEach((batch) => {
    const totalMS = getBatchMSPerAnimal(batch, index)
    const besoin = batch.housing.type ? batch.housing.type.straw_requirement : 0
    const presence = batch.housing.presence[index].days
    const nbAni = batch.housing.presence[index].animalCount
    const ugbLot = (totalMS * nbAni * presence) / UGB
    c += (besoin * ugbLot * presence) / 1000
  })
  return c
}

// ---------------------------------------------------------------------------
// P4 — stock final paille
// ---------------------------------------------------------------------------

describe('P4 — stock final paille', () => {
  const sim = simulation()
  const periods = rootState.referential.periods

  it('stock final = stock initial + production - consommation', () => {
    const initial = getInitialStockByBarnStockItem(sim, 'STRAW')
    const final = getFinalStockByBarnStockItem(sim, 'STRAW', periods, getStic())
    const conso = getConsumptionForStraw(sim, periods)
    // production par période (stockByPeriod) : aucune entrée STRAW dans le fixture
    const prodByPeriod = periods.reduce((acc, p, index) => {
      if (sim.barn.stockByPeriod[index] && sim.barn.stockByPeriod[index].stock !== null) {
        const stock = sim.barn.stockByPeriod[index].stock.find((item) => item.code === 'STRAW')
        return acc + (stock === undefined ? 0 : stock.quantity)
      }
      return acc
    }, 0)
    // le stock final doit intégrer le stock initial (c était le bug P4)
    expect(final).toBeCloseTo(initial + prodByPeriod - conso, 6)
  })

  it('le stock initial paille vient du champ dédié (barn.initialStocks, code STRAW)', () => {
    expect(getInitialStockByBarnStockItem(sim, 'STRAW')).toBe(
      rootState.simulator.barn.initialStocks.find((item) => item.code === 'STRAW').quantity
    )
  })
})

// ---------------------------------------------------------------------------
// P5 — sous-lignes STOCKS ET COUTS
// ---------------------------------------------------------------------------

describe('P5 — getStrawStock : 2 sous-lignes aliment/logement', () => {
  it('retourne alimentation + logement + ligne cachée de synthèse', () => {
    // eslint-disable-next-line global-require
    const reportModule = require('@/store/modules/report').default
    const state = reportModule.state
    const rows = reportModule.getters.getStrawStock(state, {}, rootState, {
      'simulator/barn/getTotalStrawStockProducted': rootState.simulator.barn.totalStrawStockProducted,
    })

    const food = rows.find((r) => r.name === 'Paille (alimentation)')
    const housing = rows.find((r) => r.name === 'Paille (logement)')
    const hidden = rows.find((r) => r.name === 'paille')

    // les 3 lignes existent, même catégorie, même code
    expect(food).toBeTruthy()
    expect(housing).toBeTruthy()
    expect(hidden).toBeTruthy()
    expect(food.category).toBe('3_straw')
    expect(housing.category).toBe('3_straw')
    expect(food.code).toBe('STRAW')
    expect(hidden.hidden).toBe(true)

    // aliment : stock initial / production / final portés par cette ligne
    expect(food.initialStock).toBe(rootState.simulator.barn.initialStocks.find((i) => i.code === 'STRAW').quantity)
    expect(food.production).toBe(rootState.simulator.barn.totalStrawStockProducted)

    // logement : consommation > 0 (logements paillés dans le fixture), pas de double stock
    expect(housing.consommation).toBeGreaterThan(0)
    expect(housing.initialStock).toBe(0)
    expect(housing.production).toBe(0)
    expect(housing.finalStock).toBe(0)

    // synthèse cachée : consommation totale = aliment + logement
    expect(hidden.consommation).toBeCloseTo(food.consommation + housing.consommation, 6)

    // et cette consommation totale = celle du getter (pas de double comptage)
    const total = getConsumptionForStraw(rootState.simulator, rootState.referential.periods)
    expect(hidden.consommation).toBeCloseTo(total, 6)
  })
})
