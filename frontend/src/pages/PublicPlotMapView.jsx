import { useState, useEffect, useMemo } from 'react'
import ImagePlotMapView from '../components/ImagePlotMapView'
import PublicSidebar from '../components/PublicSidebar'
import { filterPlots, defaultPlotFilters } from '../utils/filterPlots'
import { usePublicActivity } from '../hooks/usePublicActivity'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PublicPlotMapView({ layout }) {
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [filters, setFilters] = useState(defaultPlotFilters)
  const [legendOpen, setLegendOpen] = useState(true)
  const [resetZoomTrigger, setResetZoomTrigger] = useState(0)
  const [zoomInTrigger, setZoomInTrigger] = useState(0)
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0)

  const { logPlotSelect, logFilterChange } = usePublicActivity(layout?.id, layout?.layoutKind || 'plot')

  useEffect(() => {
    logPlotSelect(selectedPlot)
  }, [selectedPlot, logPlotSelect])

  useEffect(() => {
    logFilterChange(filters)
  }, [filters, logFilterChange])

  const plotsWithLayout = useMemo(
    () => (layout?.plots || []).map((p) => ({ ...p, layoutId: layout.id })),
    [layout?.plots, layout?.id]
  )

  const filteredPlots = useMemo(() => filterPlots(plotsWithLayout, filters), [plotsWithLayout, filters])

  const filtersActive =
    filters.availability !== 'All' ||
    filters.facing !== 'All' ||
    (filters.areas?.length ?? 0) > 0 ||
    (filters.prices?.length ?? 0) > 0

  const mapEmptyMessage =
    plotsWithLayout.length > 0 && filteredPlots.length === 0 && filtersActive
      ? 'No plots match your filters. Adjust filters in the sidebar.'
      : 'No plots available.'

  useEffect(() => {
    if (!selectedPlot) return
    if (!filteredPlots.some((p) => p.id === selectedPlot.id)) {
      setSelectedPlot(null)
    }
  }, [filteredPlots, selectedPlot])

  if (!layout) return null

  const imageSrc = layout.imagePath ? `${API_BASE}/uploads/${layout.imagePath}` : null

  return (
    <div className="app public-view-app">
      <main className="main-content main-content--stack public-view-main">
        <div className="plot-container plot-container--grow plot-container--public plot-container--replica">
          {legendOpen && (
            <div className="plot-legend-float" role="region" aria-label="Plot status legend">
              <span className="legend-item available">Available</span>
              <span className="legend-item booked">Booked</span>
              <span className="legend-item sold">Sold</span>
            </div>
          )}
          <ImagePlotMapView
            imageSrc={imageSrc}
            overlayConfig={layout.overlayConfig || {}}
            plots={filteredPlots}
            selectedPlot={selectedPlot}
            onSelectPlot={setSelectedPlot}
            emptyMessage={mapEmptyMessage}
            zoomPanEnabled
            detailsSide="left"
            detailsSlot={
              <PublicSidebar
                layout={layout}
                selectedPlot={selectedPlot}
                filters={filters}
                onFilterChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
                onResetFilters={() => setFilters({ ...defaultPlotFilters })}
                onZoomIn={() => setZoomInTrigger((n) => n + 1)}
                onZoomOut={() => setZoomOutTrigger((n) => n + 1)}
                onResetView={() => setResetZoomTrigger((n) => n + 1)}
                legendOpen={legendOpen}
                onToggleLegend={() => setLegendOpen((v) => !v)}
              />
            }
            resetZoomTrigger={resetZoomTrigger}
            zoomInTrigger={zoomInTrigger}
            zoomOutTrigger={zoomOutTrigger}
          />
        </div>
      </main>
    </div>
  )
}
