// site.spec.js
// Ticket 20 — Gestion sites / années climatiques (workspace local, option A)
//
// Verrouille les getters de fusion (referential.js) :
//   - siteList : fusion référentiel + workspace.sites (ids dérivés à la volée)
//   - climaticYearList(siteId) : fusion filtrée par site_id (base + custom)
//   - getSiteByClimaticYearId / getClimaticYearById : résolution base + custom
//   - aucun endpoint, 100 % local (pas de backend)

// eslint-disable-next-line global-require
const referentialModule = require('@/store/modules/referential').default

function buildReferentialState({ sites = [], climaticYears = [] } = {}) {
  return {
    sites,
    climatic_years: climaticYears,
    feed_types: [],
    concentrated_feeds: [],
  }
}

function buildWorkspaceState({ sites = [], climaticYears = [] } = {}) {
  return {
    workspace: {
      sites,
      climaticYears,
      classicFeeds: [],
      concentratedFeeds: [],
      stics: [],
      animalProfiles: [],
      simulations: [],
    },
  }
}

function buildRootState(refState, wsState) {
  return { referential: refState, workspace: wsState }
}

// ---------------------------------------------------------------------------
// siteList — fusion référentiel + custom
// ---------------------------------------------------------------------------

describe('referential — siteList (ticket 20)', () => {
  it('retourne les sites référentiels quand il n y a pas de custom', () => {
    const refState = buildReferentialState({ sites: [{ id: 1, name: 'Site A' }, { id: 2, name: 'Site B' }] })
    const wsState = buildWorkspaceState({})
    const rootState = buildRootState(refState, wsState)

    const list = referentialModule.getters.siteList(refState, {}, rootState, {})
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(1)
    expect(list[1].id).toBe(2)
  })

  it('fusionne référentiel + custom (ids dérivés à la volée)', () => {
    const refState = buildReferentialState({ sites: [{ id: 1, name: 'Site A' }, { id: 2, name: 'Site B' }] })
    const wsState = buildWorkspaceState({ sites: [{ name: 'Site C', code: 'C', description: '' }] })
    const rootState = buildRootState(refState, wsState)

    const list = referentialModule.getters.siteList(refState, {}, rootState, {})
    expect(list).toHaveLength(3)
    // le custom reçoit un id supérieur au max référentiel
    expect(list[2].id).toBe(3)
    expect(list[2].name).toBe('Site C')
  })

  it('gère le cas où la liste référentielle est vide (ids négatifs)', () => {
    const refState = buildReferentialState({ sites: [] })
    const wsState = buildWorkspaceState({ sites: [{ name: 'Site X' }] })
    const rootState = buildRootState(refState, wsState)

    const list = referentialModule.getters.siteList(refState, {}, rootState, {})
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(-1)
    expect(list[0].name).toBe('Site X')
  })

  it("ne modifie pas les listes d'origine", () => {
    const refSites = [{ id: 1, name: 'Site A' }]
    const wsSites = [{ name: 'Site B' }]
    const refState = buildReferentialState({ sites: refSites })
    const wsState = buildWorkspaceState({ sites: wsSites })
    const rootState = buildRootState(refState, wsState)

    const before = JSON.parse(JSON.stringify(refSites))
    referentialModule.getters.siteList(refState, {}, rootState, {})
    expect(refSites).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// climaticYearList(siteId) — fusion filtrée par site_id
// ---------------------------------------------------------------------------

describe('referential — climaticYearList (ticket 20)', () => {
  it('retourne les années climatiques du site référentiel', () => {
    const refState = buildReferentialState({
      climaticYears: [
        { id: 1, name: '2020 normale', site_id: 1 },
        { id: 2, name: '2020 sèche', site_id: 1 },
        { id: 3, name: '2021 normale', site_id: 2 },
      ],
    })
    const wsState = buildWorkspaceState({})
    const rootState = buildRootState(refState, wsState)

    const list = referentialModule.getters.climaticYearList(refState, {}, rootState, {})(1)
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(1)
    expect(list[1].id).toBe(2)
  })

  it('fusionne les années climatiques custom du même site', () => {
    const refState = buildReferentialState({
      climaticYears: [{ id: 1, name: '2020 normale', site_id: 1 }],
    })
    const wsState = buildWorkspaceState({
      climaticYears: [{ name: '2023 test', site_id: 1 }],
    })
    const rootState = buildRootState(refState, wsState)

    const list = referentialModule.getters.climaticYearList(refState, {}, rootState, {})(1)
    expect(list).toHaveLength(2)
    // la custom reçoit un id supérieur au max référentiel
    expect(list[1].id).toBe(2)
    expect(list[1].name).toBe('2023 test')
  })

  it("filtre les custom d'un autre site", () => {
    const refState = buildReferentialState({
      climaticYears: [{ id: 1, name: '2020 normale', site_id: 1 }],
    })
    const wsState = buildWorkspaceState({
      climaticYears: [{ name: '2023 test', site_id: 2 }], // site 2, pas 1
    })
    const rootState = buildRootState(refState, wsState)

    const list = referentialModule.getters.climaticYearList(refState, {}, rootState, {})(1)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(1)
  })

  it('gère le cas vide (pas de base, pas de custom)', () => {
    const refState = buildReferentialState({})
    const wsState = buildWorkspaceState({})
    const rootState = buildRootState(refState, wsState)

    const list = referentialModule.getters.climaticYearList(refState, {}, rootState, {})(99)
    expect(list).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// getSiteByClimaticYearId — résolution base + custom
// ---------------------------------------------------------------------------

describe('referential — getSiteByClimaticYearId (ticket 20)', () => {
  it('résout le site d une année climatique référentielle', () => {
    const refState = buildReferentialState({
      sites: [{ id: 1, name: 'Site A' }],
      climaticYears: [{ id: 10, name: '2020', site_id: 1 }],
    })
    const wsState = buildWorkspaceState({})
    const rootState = buildRootState(refState, wsState)

    const site = referentialModule.getters.getSiteByClimaticYearId(refState, {}, rootState, {})(10)
    expect(site.id).toBe(1)
    expect(site.name).toBe('Site A')
  })

  it('résout un site custom pour une année climatique custom', () => {
    const refState = buildReferentialState({})
    const wsState = buildWorkspaceState({
      sites: [{ id: -1, name: 'Site Custom' }],
      climaticYears: [{ id: -5, name: '2024', site_id: -1 }],
    })
    const rootState = buildRootState(refState, wsState)

    const site = referentialModule.getters.getSiteByClimaticYearId(refState, {}, rootState, {})(-5)
    expect(site.name).toBe('Site Custom')
  })
})

// ---------------------------------------------------------------------------
// getClimaticYearById — résolution base + custom
// ---------------------------------------------------------------------------

describe('referential — getClimaticYearById (ticket 20)', () => {
  it('résout une année climatique référentielle', () => {
    const refState = buildReferentialState({
      climaticYears: [{ id: 10, name: '2020', site_id: 1 }],
    })
    const wsState = buildWorkspaceState({})
    const rootState = buildRootState(refState, wsState)

    const cy = referentialModule.getters.getClimaticYearById(refState, {}, rootState, {})(10)
    expect(cy.name).toBe('2020')
  })

  it('résout une année climatique custom', () => {
    const refState = buildReferentialState({})
    const wsState = buildWorkspaceState({
      climaticYears: [{ id: -5, name: '2024 custom', site_id: -1 }],
    })
    const rootState = buildRootState(refState, wsState)

    const cy = referentialModule.getters.getClimaticYearById(refState, {}, rootState, {})(-5)
    expect(cy.name).toBe('2024 custom')
  })
})
