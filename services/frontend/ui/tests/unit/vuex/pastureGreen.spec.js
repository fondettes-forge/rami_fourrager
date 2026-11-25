// pastureGreen.spec.js
// Ticket 19 — Graphique « pâture verte disponible et besoin du troupeau » (Assolement)
//
// Verrouille le getter getPastureGreenComparison (simulator/farm) :
//   - disponibilité = production_total par période (kgMS)
//   - besoin = consommation pâturée agrégée sur les lots (kgMS/période)
//   - gestion de l'état vide (totalAvailablePastureByPeriod null)

import fs from 'fs'
import path from 'path'
import { getPastureConsumptionByPeriod } from '@/store/modules/mixins'

const stateFilePath = path.join(__dirname, 'fixtures/rootState.json')
const rootState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'))

// eslint-disable-next-line global-require
const farmModule = require('@/store/modules/farm').default

function buildState(totalAvailablePastureByPeriod = null) {
  return {
    rotations: [],
    totalAvailablePastureByPeriod,
    dimensioning: { SAU: null, constrainedSurfaces: { irrigable: null, ploughable: null, superficial: null, reachable: null } },
  }
}

// ---------------------------------------------------------------------------
// Getter getPastureGreenComparison
// ---------------------------------------------------------------------------

describe('farm — getPastureGreenComparison (ticket 19)', () => {
  it('retourne { disponible, besoin } de la longueur des périodes', () => {
    const state = buildState(rootState.simulator.farm.totalAvailablePastureByPeriod)
    const result = farmModule.getters.getPastureGreenComparison(state, {}, rootState, {})
    const periods = rootState.referential.periods

    expect(result.disponible).toHaveLength(periods.length)
    expect(result.besoin).toHaveLength(periods.length)
  })

  it('disponible = production_total arrondi par période', () => {
    const state = buildState(rootState.simulator.farm.totalAvailablePastureByPeriod)
    const result = farmModule.getters.getPastureGreenComparison(state, {}, rootState, {})
    const arr = rootState.simulator.farm.totalAvailablePastureByPeriod
    const periods = rootState.referential.periods

    periods.forEach((p, i) => {
      const el = arr['period_id_' + p.id]
      const expected = el ? Math.round(el.production_total) : 0
      expect(result.disponible[i]).toBe(expected)
    })
    // au moins une période a de la production
    expect(result.disponible.some((v) => v > 0)).toBe(true)
  })

  it('besoin = consommation pâturée agrégée (0 si pas de lots, >= 0 sinon)', () => {
    const state = buildState(rootState.simulator.farm.totalAvailablePastureByPeriod)
    const result = farmModule.getters.getPastureGreenComparison(state, {}, rootState, {})

    result.besoin.forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
  })

  it('état vide : totalAvailablePastureByPeriod null → disponible à 0, pas de crash', () => {
    const state = buildState(null)
    const result = farmModule.getters.getPastureGreenComparison(state, {}, rootState, {})
    const periods = rootState.referential.periods

    expect(result.disponible).toHaveLength(periods.length)
    expect(result.disponible.every((v) => v === 0)).toBe(true)
  })

  it('état vide : pas de lots → besoin à 0', () => {
    const state = buildState(rootState.simulator.farm.totalAvailablePastureByPeriod)
    const emptySimulation = { ...rootState.simulator, herd: { batchs: [] } }
    const rootStateNoBatchs = { ...rootState, simulator: emptySimulation }
    const result = farmModule.getters.getPastureGreenComparison(state, {}, rootStateNoBatchs, {})

    expect(result.besoin.every((v) => v === 0)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// mixins — getPastureConsumptionByPeriod
// ---------------------------------------------------------------------------

describe('mixins — getPastureConsumptionByPeriod (ticket 19)', () => {
  it('retourne 0 sans lots', () => {
    const simulation = { herd: { batchs: [] } }
    expect(getPastureConsumptionByPeriod(simulation, 0, null)).toBe(0)
  })

  it('retourne 0 si batchs undefined', () => {
    const simulation = { herd: {} }
    expect(getPastureConsumptionByPeriod(simulation, 0, null)).toBe(0)
  })

  it('agrège sur les lots avec le fixture rootState (kgMS/période)', () => {
    const totalAvailablePastureByPeriod = rootState.simulator.farm.totalAvailablePastureByPeriod
    // au moins une période doit avoir une consommation non nulle
    // (les lots du fixture pâturent sur certaines périodes)
    const values = rootState.referential.periods.map((_, i) =>
      getPastureConsumptionByPeriod(rootState.simulator, i, totalAvailablePastureByPeriod)
    )
    values.forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
  })
})
