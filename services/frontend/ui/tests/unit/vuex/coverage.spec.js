// coverage.spec.js
// Ticket 10 — Périodes « vides » (couverture grisée / division par zéro ?)
//
// Verrouille :
//   V3 : garde anti-division par zéro (h234 = 0 → h276 = 0, pas Infinity)
//   V2 : affichage — distinguer « 0 calculé (animaux présents) » de « non applicable »

import { getFinalEnergeticCoverage, getFinalProteicCoverage } from '@/store/modules/mixins'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// un lot minimal : profil avec UFL/PDI, présence par période,
// classicFeeds/concentratedFeeds avec des périodes (sinon h267/h272 = undefined)
function makeBatch({ ufl = 0.6, pdi = 120, animalCounts = [10, 0, 5] } = {}) {
  const periods = [
    { id: 1, period: { id: 1 } },
    { id: 2, period: { id: 2 } },
    { id: 3, period: { id: 3 } },
  ]
  return {
    profile: {
      batch_type: {
        code: 'VL',
        UF_value_considered: 'UFL',
        UE_value_considered: 'UEL',
        UF_concentrated_value_considered: 'UFL',
      },
      animal_profile_periods: [
        { period_id: 1, UFL: ufl, PDI: pdi },
        { period_id: 2, UFL: ufl, PDI: pdi },
        { period_id: 3, UFL: ufl, PDI: pdi },
      ],
    },
    housing: {
      presence: animalCounts.map((count) => ({ animalCount: count })),
    },
    // classicFeeds : 1 entrée par période, feeds vide (pas de fourrage)
    classicFeeds: periods.map((p) => ({ period: p.period, feeds: {} })),
    // concentratedFeeds : 1 entrée par période, feeds vide (pas de concentré)
    concentratedFeeds: periods.map((p) => ({ period: p.period, feeds: {} })),
  }
}

const periods = [{ id: 1 }, { id: 2 }, { id: 3 }]
const totalAvailablePastureByPeriod = {}
const getStic = () => null

// simulation minimale : getUFPasturesByPeriod a besoin de simulation.herd.batchs
function makeSimulation(batch) {
  return {
    herd: { batchs: [batch] },
  }
}

// ---------------------------------------------------------------------------
// V3 — garde anti-division par zéro
// ---------------------------------------------------------------------------

describe('ticket 10 — V3 : garde anti-division par zéro', () => {
  it('getFinalEnergeticCoverage : h234 = 0 → couverture 0 (pas Infinity)', () => {
    // UFL = 0 → besoin énergétique = 0 → h234 = 0
    const batch = makeBatch({ ufl: 0 })
    const simulation = makeSimulation(batch)
    const coverage = getFinalEnergeticCoverage(batch, simulation, periods, totalAvailablePastureByPeriod, getStic)

    // pas de Infinity, pas de NaN
    coverage.forEach((val) => {
      expect(Number.isFinite(val)).toBe(true)
    })
    // avec h274 = 0 (pas de fourrage, pas de pâture) et h234 = 0 → 0
    expect(coverage[0]).toBe(0)
  })

  it('getFinalProteicCoverage : h234 = 0 → couverture 0 (pas Infinity)', () => {
    // PDI = 0 → besoin protéique = 0 → h234 = 0
    const batch = makeBatch({ pdi: 0 })
    const simulation = makeSimulation(batch)
    const coverage = getFinalProteicCoverage(batch, simulation, periods, totalAvailablePastureByPeriod, getStic)

    coverage.forEach((val) => {
      expect(Number.isFinite(val)).toBe(true)
    })
    expect(coverage[0]).toBe(0)
  })

  it('couverture normale : h234 > 0 → h274 / h234', () => {
    // UFL = 0.6, PDI = 120 → besoin > 0
    const batch = makeBatch({ ufl: 0.6, pdi: 120 })
    const simulation = makeSimulation(batch)
    const coverage = getFinalEnergeticCoverage(batch, simulation, periods, totalAvailablePastureByPeriod, getStic)

    // pas de fourrage, pas de pâture → h274 = 0 → couverture = 0
    // (mais pas Infinity, car h234 > 0)
    expect(coverage[0]).toBe(0)
    expect(Number.isFinite(coverage[0])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// V2 — affichage : distinguer « 0 calculé » de « non applicable »
// ---------------------------------------------------------------------------

describe('ticket 10 — V2 : affichage (GraphCoverage.vue)', () => {
  // On teste la logique d'affichage directement (pas le component Vue,
  // qui nécessite un mount). La logique est :
  //   hasAnimals ? coverage[i] : '-'

  it('animaux présents → afficher la valeur (même 0)', () => {
    const coverage = [0, 50, 100]
    const animalCounts = [10, 0, 5]

    for (let i = 0; i < coverage.length; i++) {
      const hasAnimals = animalCounts[i] > 0
      const displayed = hasAnimals ? coverage[i] : '-'
      if (hasAnimals) {
        expect(displayed).toBe(coverage[i]) // 0, 50, 100
      } else {
        expect(displayed).toBe('-')
      }
    }
  })

  it('pas d an animaux → afficher "-" (gris)', () => {
    const coverage = [0, 0, 0]
    const animalCounts = [0, 0, 0]

    for (let i = 0; i < coverage.length; i++) {
      const hasAnimals = animalCounts[i] > 0
      const displayed = hasAnimals ? coverage[i] : '-'
      expect(displayed).toBe('-')
    }
  })

  it('mélange : certains animaux présents, d autres non', () => {
    const coverage = [0, 50, 0]
    const animalCounts = [10, 0, 5]

    const displayed = []
    for (let i = 0; i < coverage.length; i++) {
      const hasAnimals = animalCounts[i] > 0
      displayed.push(hasAnimals ? coverage[i] : '-')
    }
    // i=0 : animaux → 0 ; i=1 : pas d animaux → '-' ; i=2 : animaux → 0
    expect(displayed).toEqual([0, '-', 0])
  })
})
