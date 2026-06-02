/**
 * Filter plots for public map view (matches Filters.jsx).
 * @param {Array} plots
 * @param {{ availability: string, facing: string, areas: string[], prices: string[] }} filters
 */
export function filterPlots(plots, filters) {
  if (!plots?.length) return []

  const areas = filters.areas ?? []
  const prices = filters.prices ?? []

  return plots.filter((plot) => {
    const status = (plot.status || 'Available').trim()
    if (filters.availability !== 'All' && status !== filters.availability) return false

    const facing = (plot.facing || '').trim()
    if (filters.facing !== 'All' && facing !== filters.facing) return false

    const cent = Number(plot.areaCent) || 0
    if (areas.length > 0) {
      const matchArea = areas.some((option) => {
        if (option === 'Below 2' && cent < 2) return true
        if (option === '2-3' && cent >= 2 && cent < 3) return true
        if (option === '3-5' && cent >= 3 && cent < 5) return true
        if (option === '5-10' && cent >= 5 && cent < 10) return true
        if (option === 'Above 10' && cent >= 10) return true
        return false
      })
      if (!matchArea) return false
    }

    const price = Number(plot.estimatedPrice) || 0
    if (prices.length > 0) {
      const L = 100_000
      const matchPrice = prices.some((option) => {
        if (option === 'Below 3L' && price < 3 * L) return true
        if (option === '3L-5L' && price >= 3 * L && price < 5 * L) return true
        if (option === '5L-10L' && price >= 5 * L && price < 10 * L) return true
        if (option === '10L-25L' && price >= 10 * L && price < 25 * L) return true
        if (option === 'Above 25L' && price >= 25 * L) return true
        return false
      })
      if (!matchPrice) return false
    }

    return true
  })
}

export const defaultPlotFilters = {
  availability: 'All',
  facing: 'All',
  areas: [],
  prices: [],
}
