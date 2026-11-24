// migration unitaire (ticket 3) : le stock initial paille était saisi en kg avant
// le passage en tonnes ; une valeur > 1000 est considérée comme un ancien stock
// en kg et convertie en tonnes à la charge de la simulation. (un stock de
// 10 000 t de paille est absurde ; 10 000 kg = 10 t est la valeur type du mail INRAE)
function migrateStrawInitialStockToTons(initialStocks) {
  return (initialStocks || []).map((stock) => {
    if (stock.code === 'STRAW' && stock.quantity > 1000) {
      return { ...stock, quantity: stock.quantity / 1000 }
    }
    return stock
  })
}
export default {
  namespaced: true,
  state: {
    stockByPeriod: [],
    refusalRate: 0,
    initialStocks: [],
  },
  mutations: {
    setBarn(state, { initialStocks, stockByPeriod, refusalRate }) {
      state.initialStocks = migrateStrawInitialStockToTons(initialStocks)
      state.stockByPeriod = stockByPeriod
      state.refusalRate = refusalRate
    },
    // barn
    setInitialBarnStock(state, initialData) {
      state.initialStocks = initialData
    },
    deleteBarnStockItem(state, stock) {
      state.initialStocks = state.initialStocks.filter(
        (item) => !(item.code === stock.code && item.name === stock.name)
      )
    },
    setInitialStocks(state, initialStock) {
      const index = state.initialStocks.findIndex((el) => el.code === initialStock.code)
      if (index > -1) {
        state.initialStocks[index].quantity = initialStock.quantity
      } else {
        state.initialStocks.push(initialStock)
      }
    },
    setRefusalRate(state, refusalRate) {
      state.refusalRate = refusalRate
    },
    setTotalStrawStockProducted(state, stock) {
      state.totalStrawStockProducted = stock
    },
    setStockByPeriod(state, stockByPeriod) {
      state.stockByPeriod = stockByPeriod
    },
  },
  getters: {
    initialStocks: (state) => {
      // STRAW (ticket 8), RC/RP/RT (concentrés, saisis dans leur champ dédié, ticket 12)
      // sont exclus de la table générique des stocks fourragers
      return state.initialStocks.filter(
        (el) => el.code !== 'STRAW' && el.code !== 'RP' && el.code !== 'RC' && el.code !== 'RT'
      )
    },
    getInitialStockQuantityByCode: (state) => (code) => {
      let quantity = 0
      if (state.initialStocks.length > 0) {
        const index = state.initialStocks.findIndex((el) => el.code === code)
        if (index > -1) {
          quantity = state.initialStocks[index].quantity
        }
      }
      return quantity
    },
    getTotalStrawStockProducted(state) {
      return state.totalStrawStockProducted
    },
    getRefusalRate: (state) => state.refusalRate,
  },
  actions: {
    setSimulation({ state, commit }) {
      commit('workspace/updateSimulation', { key: 'barn', value: state }, { root: true })
    },
  },
}
