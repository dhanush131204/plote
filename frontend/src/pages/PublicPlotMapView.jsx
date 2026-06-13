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
    <div className="interactive-sidebar-layout">
      {/* Full-Screen Map Area */}
      <div className="map-container">
        <ImagePlotMapView
          imageSrc={imageSrc}
          overlayConfig={layout.overlayConfig || {}}
          plots={filteredPlots}
          selectedPlot={selectedPlot}
          onSelectPlot={setSelectedPlot}
          emptyMessage={mapEmptyMessage}
          zoomPanEnabled
          resetZoomTrigger={resetZoomTrigger}
          zoomInTrigger={zoomInTrigger}
          zoomOutTrigger={zoomOutTrigger}
        />
      </div>

      {/* Permanent Right Sidebar */}
      <aside className="sidebar-container">
        <PublicSidebar
          layout={layout}
          selectedPlot={selectedPlot}
          onSelectPlot={setSelectedPlot}
          filters={filters}
          onFilterChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
          onResetFilters={() => setFilters({ ...defaultPlotFilters })}
          onZoomIn={() => setZoomInTrigger((n) => n + 1)}
          onZoomOut={() => setZoomOutTrigger((n) => n + 1)}
          onResetView={() => setResetZoomTrigger((n) => n + 1)}
          legendOpen={legendOpen}
          onToggleLegend={() => setLegendOpen((v) => !v)}
          onClearSelection={() => setSelectedPlot(null)}
        />
      </aside>
    </div>
  )
}
