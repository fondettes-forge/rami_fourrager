// duplicateSimulation.spec.js
// Ticket 21 — Duplication de simulation (« Enregistrer-sous »)
//
// Verrouille la mutation workspace/duplicateSimulation :
//   - la copie est profonde (pas de partage de référence avec la source)
//   - la source n'est pas modifiée
//   - loaded = false sur la copie, lastModifiedDate renseignée

import { deepCopy } from '@/plugins/utils'

// Le module workspace importe mapper → calculations → '@/store' (index),
// qui instancie un Vuex store complet + localforage (indisponible en jsdom).
// On le mock au minimum pour isoler la mutation testée.
jest.mock('@/store', () => ({ state: {}, getters: {} }), { virtual: true })

// eslint-disable-next-line global-require
const workspaceModule = require('@/store/modules/workspace').default

function buildWorkspace() {
  return {
    workspace: {
      simulations: [
        {
          name: 'Ma sim de base',
          description: 'scénario de référence',
          lastModifiedDate: '01/01/2026',
          loaded: true,
          farm: { rotations: [{ soil: 'BL1', name: 'Blé', surface: 10 }], dimensioning: { SAU: 50 } },
          barn: { initialStocks: [{ code: 'FH', quantity: 100 }] },
          herd: { batchs: [{ name: 'Vaches', count: 10 }] },
          report: { soldedStock: { FH: { purchaseCost: 10, sale: 0, costOfSell: 0, productionCost: 0 } } },
        },
      ],
    },
  }
}

describe('workspace — duplicateSimulation (ticket 21)', () => {
  it('ajoute une copie dans workspace.simulations', () => {
    const state = buildWorkspace()
    const source = state.workspace.simulations[0]
    workspaceModule.mutations.duplicateSimulation(state, { simulation: source, name: 'Ma sim de base (copie)' })

    expect(state.workspace.simulations).toHaveLength(2)
    const copy = state.workspace.simulations[1]
    expect(copy.name).toBe('Ma sim de base (copie)')
    expect(copy.description).toBe('scénario de référence')
  })

  it('la copie est profonde : muter la copie ne touche pas la source', () => {
    const state = buildWorkspace()
    const source = state.workspace.simulations[0]
    workspaceModule.mutations.duplicateSimulation(state, { simulation: source, name: 'Copie' })

    const copy = state.workspace.simulations[1]
    // mutation profonde sur la copie
    copy.farm.rotations[0].surface = 999
    copy.herd.batchs[0].count = 999
    copy.report.soldedStock.FH.purchaseCost = 999

    // la source est inchangée
    expect(source.farm.rotations[0].surface).toBe(10)
    expect(source.herd.batchs[0].count).toBe(10)
    expect(source.report.soldedStock.FH.purchaseCost).toBe(10)
  })

  it('la source n est pas modifiée par la duplication', () => {
    const state = buildWorkspace()
    const source = state.workspace.simulations[0]
    const before = deepCopy(source)
    workspaceModule.mutations.duplicateSimulation(state, { simulation: source, name: 'Copie' })

    expect(source).toEqual(before)
  })

  it('la copie est chargée à false avec une date de dernière modification', () => {
    const state = buildWorkspace()
    const source = state.workspace.simulations[0]
    workspaceModule.mutations.duplicateSimulation(state, { simulation: source, name: 'Copie' })

    const copy = state.workspace.simulations[1]
    expect(copy.loaded).toBe(false)
    expect(copy.lastModifiedDate).not.toBe('')
  })
})
