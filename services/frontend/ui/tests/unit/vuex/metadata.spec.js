// metadata.spec.js
// Ticket 24 — Métadonnées référentiel
//
// Verrouille (côté store, sans DOM) :
//   - les getters de fusion conservent les métadonnées (resume, description,
//     source, updated_at) des éléments référentiels ET des cartes custom ;
//   - getSticByName (consommé par les calculs de production) reste robuste
//     quand une baguette ne porte pas de métadonnées (cas legacy / custom).

import { getBatchConsumption } from '@/store/modules/mixins'
import BaseMetadataTooltip from '@/components/base/MetadataTooltip.vue'

// eslint-disable-next-line global-require
const referentialModule = require('@/store/modules/referential').default

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

function buildReferentialState({ feedTypes = [], stics = [] } = {}) {
  return {
    referential: {
      feed_types: feedTypes,
      stics,
    },
    workspace: {
      workspace: {
        classicFeeds: [customClassicFeed],
        concentratedFeeds: [],
        stics: [],
      },
    },
  }
}

function buildGetters(state) {
  return {
    classicFeedList: referentialModule.getters.classicFeedList(state.referential, {}, state, {}),
    sticList: referentialModule.getters.sticList(state.referential, {}, state, {}),
  }
}

// ---------------------------------------------------------------------------
// 1 — Métadonnées conservées par la fusion (classicFeedList)
// ---------------------------------------------------------------------------

describe('ticket 24 — métadonnées conservées par classicFeedList', () => {
  it('conserve description / source / updated_at d un type de ration référentiel', () => {
    const feedTypes = [
      {
        id: 1,
        name: 'Foin bonne qualité',
        correspondingStock: 'FH',
        description: 'Foin de qualité supérieure',
        source: 'Tables INRA',
        updated_at: '2026-11-01T10:00:00',
      },
    ]
    const state = buildReferentialState({ feedTypes })
    const list = buildGetters(state).classicFeedList

    const ref = list.find((el) => el.id === 1)
    expect(ref).toBeDefined()
    expect(ref.description).toBe('Foin de qualité supérieure')
    expect(ref.source).toBe('Tables INRA')
    expect(ref.updated_at).toBe('2026-11-01T10:00:00')
  })

  it('conserve les métadonnées de la carte custom (aucune perte à la fusion)', () => {
    const feedTypes = [{ id: 1, name: 'Foin bonne qualité', correspondingStock: 'FH' }]
    const state = buildReferentialState({ feedTypes })
    const list = buildGetters(state).classicFeedList

    const custom = list.find((el) => el.name === customClassicFeed.name)
    expect(custom).toBeDefined()
    // les champs custom sont conservés tels quels
    expect(custom.correspondingStock).toBe('FH')
    expect(custom.nutritional_values.UFL).toBe(0.6)
    // pas de champ référentiel inventé sur la carte custom
    expect(custom.description).toBeUndefined()
    expect(custom.updated_at).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 2 — Métadonnées conservées par la fusion (sticList)
// ---------------------------------------------------------------------------

describe('ticket 24 — métadonnées conservées par sticList', () => {
  it('conserve resume / source / updated_at d une baguette référentielle', () => {
    const stics = [
      {
        id: 1,
        climatic_year_id: 1,
        name: 'PP1 : productive et très précoce',
        type: 'PP',
        resume: 'Baguette PP expérimentée en Brenne',
        source: 'INRAE',
        updated_at: '2026-10-15T08:30:00',
      },
    ]
    const state = buildReferentialState({ stics })
    const list = buildGetters(state).sticList(1)

    expect(list).toHaveLength(1)
    expect(list[0].resume).toBe('Baguette PP expérimentée en Brenne')
    expect(list[0].source).toBe('INRAE')
    expect(list[0].updated_at).toBe('2026-10-15T08:30:00')
  })

  it('ne casse pas avec une baguette sans métadonnées (legacy / custom)', () => {
    const stics = [
      {
        id: 1,
        climatic_year_id: 1,
        name: 'Baguette legacy',
        type: 'PP',
      },
    ]
    const state = buildReferentialState({ stics })
    const list = buildGetters(state).sticList(1)

    expect(list).toHaveLength(1)
    expect(list[0].resume).toBeUndefined()
    expect(list[0].updated_at).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 3 — Garde-fou : calculs en aval robustes sans métadonnées
// ---------------------------------------------------------------------------

describe('ticket 24 — calculs en aval robustes sans métadonnées', () => {
  it('getBatchConsumption ne dépend pas des métadonnées de la carte', () => {
    // une carte custom SANS aucune métadonnée (cas legacy) doit être comptée
    // comme n importe quelle autre carte : le calcul lit correspondingStock
    // uniquement (ticket 1 C5), les métadonnées n y sont pas référencées.
    const batch = {
      profile: {
        batch_type: {
          code: 'VL',
          UF_value_considered: 'UFL',
          UE_value_considered: 'UEL',
          UF_concentrated_value_considered: 'UFL',
        },
        animal_profile_periods: [{ period_id: 1, UFL: 0.6, PDI: 120 }],
      },
      classicFeeds: [
        {
          period: { id: 1 },
          feeds: [
            {
              type: {
                name: 'Carte sans métadonnées',
                correspondingStock: 'FH',
                nutritional_values: customClassicFeed.nutritional_values,
              },
              proportion: 100,
            },
          ],
        },
      ],
      housing: {
        presence: [{ animalCount: 10 }],
      },
    }

    const consumption = getBatchConsumption(batch, 1, 'FH')
    expect(consumption).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 4 — Composant BaseMetadataTooltip (calculs, sans DOM)
// ---------------------------------------------------------------------------

describe('ticket 24 — BaseMetadataTooltip (calculs)', () => {
  function makeVm(propsData) {
    const vm = {
      description: propsData.description || '',
      source: propsData.source || '',
      updatedAt: propsData.updatedAt || '',
    }
    // exécute les computed du composant sur le vm (sans DOM)
    Object.keys(BaseMetadataTooltip.computed).forEach((key) => {
      vm[key] = BaseMetadataTooltip.computed[key].call(vm)
    })
    // hasContent dépend de updatedLabel (défini plus tôt dans computed) :
    // on le réévalue après l'évaluation de tous les computed.
    vm.hasContent = BaseMetadataTooltip.computed.hasContent.call(vm)
    return vm
  }

  it('hasContent = true si au moins une métadonnée est renseignée', () => {
    expect(makeVm({ description: 'desc' }).hasContent).toBe(true)
    expect(makeVm({ source: 'INRAE' }).hasContent).toBe(true)
    expect(makeVm({ updatedAt: '2026-11-01T10:00:00' }).hasContent).toBe(true)
  })

  it('hasContent = false sans aucune métadonnée (fallback simple)', () => {
    expect(makeVm({}).hasContent).toBe(false)
  })

  it('updatedLabel : date ISO formatée au format français', () => {
    const vm = makeVm({ updatedAt: '2026-11-01T10:00:00' })
    expect(vm.updatedLabel).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('updatedLabel : date invalide ou absente → vide', () => {
    expect(makeVm({ updatedAt: 'pas-une-date' }).updatedLabel).toBe('')
    expect(makeVm({}).updatedLabel).toBe('')
  })
})
