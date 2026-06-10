import { useState, useEffect, useMemo } from 'react'
import ImagePlotMapView from '../components/ImagePlotMapView'
import PublicBuildingSidebar from '../components/PublicBuildingSidebar'
import FloorStackPicker from '../components/FloorStackPicker'
import BuildingPreview3D from '../components/BuildingPreview3D'
import ConfigurationPicker from '../components/ConfigurationPicker'
import { filterPlots, defaultPlotFilters } from '../utils/filterPlots'
import { usePublicActivity } from '../hooks/usePublicActivity'
import {
  bedsForConfigurationId,
  getFacadeOverlayFlat,
  getFloorOverlay,
  normalizeOverlayForBuilding,
} from '../utils/buildingSchema'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PublicBuildingView({ layout }) {
  const [publicStep, setPublicStep] = useState('units')
  const [selectedConfigId, setSelectedConfigId] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedFloorId, setSelectedFloorId] = useState(null)
  const [filters, setFilters] = useState(defaultPlotFilters)
  const [legendOpen, setLegendOpen] = useState(true)
  const [resetZoomTrigger, setResetZoomTrigger] = useState(0)
  const [zoomInTrigger, setZoomInTrigger] = useState(0)
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0)

  const { logPlotSelect, logFilterChange } = usePublicActivity(layout?.id, layout?.layoutKind || 'building')

  useEffect(() => {
    logPlotSelect(selectedUnit)
  }, [selectedUnit, logPlotSelect])

  useEffect(() => {
    logFilterChange(filters)
  }, [filters, logFilterChange])

  const floors = layout?.building?.floors || []
  const sortedFloors = useMemo(
    () => [...floors].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [floors]
  )

  const hasFacadeFlow = useMemo(() => {
    const path = layout?.building?.facadeImagePath
    const fb = normalizeOverlayForBuilding(layout?.overlayConfig).facadeByFloor || {}
    const hasPoly = Object.keys(fb).some((k) => (fb[k]?.points || []).length >= 4)
    return Boolean(path && hasPoly)
  }, [layout?.building?.facadeImagePath, layout?.overlayConfig])

  useEffect(() => {
    if (!layout?.id) return
    if (hasFacadeFlow) {
      setPublicStep('facade')
      setSelectedFloorId(null)
      setSelectedConfigId(null)
      setSelectedUnit(null)
    } else {
      setPublicStep('units')
      setSelectedConfigId(null)
    }
  }, [layout?.id, hasFacadeFlow])

  useEffect(() => {
    if (publicStep === 'facade') return
    if (sortedFloors.length && !selectedFloorId) {
      setSelectedFloorId(sortedFloors[0].id)
    }
  }, [sortedFloors, selectedFloorId, publicStep])

  const overlayNorm = useMemo(() => normalizeOverlayForBuilding(layout?.overlayConfig), [layout?.overlayConfig])
  const floorOverlay = useMemo(
    () => getFloorOverlay(overlayNorm, selectedFloorId),
    [overlayNorm, selectedFloorId]
  )
  const facadeOverlayFlat = useMemo(() => getFacadeOverlayFlat(overlayNorm), [overlayNorm])

  const facadeImageSrc = layout?.building?.facadeImagePath
    ? `${API_BASE}/uploads/${layout.building.facadeImagePath}`
    : null

  const facadePlots = useMemo(() => {
    return sortedFloors.map((f) => ({
      id: f.id,
      number: f.id,
      floor: f.id,
      tower: layout?.building?.towers?.[0]?.id || 'A',
      beds: 2,
      areaCent: 0,
      areaSqft: 0,
      facing: 'East',
      status: 'Available',
      pricePerSqft: 0,
      estimatedPrice: 0,
    }))
  }, [sortedFloors, layout?.building?.towers])

  const selectedFacadePlot = useMemo(
    () => (selectedFloorId ? facadePlots.find((p) => p.id === selectedFloorId) || null : null),
    [facadePlots, selectedFloorId]
  )

  const currentFloor = sortedFloors.find((f) => f.id === selectedFloorId)
  const imageSrc = currentFloor?.imagePath ? `${API_BASE}/uploads/${currentFloor.imagePath}` : null

  const embedUrl = layout?.building?.embed3dUrl?.trim()

  const configBeds = selectedConfigId ? bedsForConfigurationId(selectedConfigId) : null

  const unitsWithLayout = useMemo(
    () =>
      (layout?.plots || [])
        .filter((p) => selectedFloorId != null && String(p.floor) === String(selectedFloorId))
        .filter((p) => configBeds == null || Number(p.beds) === configBeds)
        .map((p) => ({ ...p, layoutId: layout.id })),
    [layout?.plots, layout?.id, selectedFloorId, configBeds]
  )

  const filteredUnits = useMemo(() => filterPlots(unitsWithLayout, filters), [unitsWithLayout, filters])

  const filtersActive =
    filters.availability !== 'All' ||
    filters.facing !== 'All' ||
    (filters.areas?.length ?? 0) > 0 ||
    (filters.prices?.length ?? 0) > 0

  const mapEmptyMessage =
    unitsWithLayout.length > 0 && filteredUnits.length === 0 && filtersActive
      ? 'No units match your filters. Adjust filters in the sidebar.'
      : 'No units on this floor for this configuration.'

  useEffect(() => {
    if (!selectedUnit) return
    if (!filteredUnits.some((u) => u.id === selectedUnit.id)) {
      setSelectedUnit(null)
    }
  }, [filteredUnits, selectedUnit])

  useEffect(() => {
    if (publicStep !== 'config' || !selectedFloorId) return
    const floor = sortedFloors.find((f) => f.id === selectedFloorId)
    const cfgs = floor?.configurations || []
    if (cfgs.length === 0) {
      setPublicStep('units')
      setSelectedConfigId(null)
    }
  }, [publicStep, selectedFloorId, sortedFloors])

  const handleSkipToFloorPlan = () => {
    setPublicStep('units')
    setSelectedConfigId(null)
    setSelectedUnit(null)
    if (!selectedFloorId && sortedFloors[0]) setSelectedFloorId(sortedFloors[0].id)
  }

  const handleFacadeFloorPick = (floorId) => {
    setSelectedFloorId(floorId)
    setPublicStep('config')
    setSelectedUnit(null)
    setSelectedConfigId(null)
  }

  if (!layout) return <div className="app-loading">Layout not found.</div>

  const selectedStepShowsUnits = publicStep === 'units'

  const beforeMapSlot =
    publicStep === 'units' ? (
      <div className="public-building-before-map">
        <div className="public-building-embed-row">
          {embedUrl ? (
            <div className="public-building-embed-wrap">
              <p className="public-building-embed-label">Virtual tour</p>
              <iframe
                title="3D tour embed"
                src={embedUrl}
                className="public-building-embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
          <div className="public-building-3d-wrap">
            <BuildingPreview3D
              floors={sortedFloors}
              selectedFloorId={selectedFloorId}
              onSelectFloor={(fid) => {
                setSelectedFloorId(fid)
                setSelectedUnit(null)
              }}
            />
          </div>
        </div>
        <FloorStackPicker
          floors={sortedFloors}
          selectedFloorId={selectedFloorId}
          onSelectFloor={(id) => {
            setSelectedFloorId(id)
            setSelectedUnit(null)
          }}
        />
      </div>
    ) : publicStep === 'facade' ? (
      <div className="public-building-before-map">
        <div className="public-building-embed-row">
          {embedUrl ? (
            <div className="public-building-embed-wrap">
              <p className="public-building-embed-label">Virtual tour</p>
              <iframe
                title="3D tour embed"
                src={embedUrl}
                className="public-building-embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
          <div className="public-building-3d-wrap">
            <BuildingPreview3D
              floors={sortedFloors}
              selectedFloorId={selectedFloorId}
              onSelectFloor={(fid) => handleFacadeFloorPick(fid)}
            />
          </div>
        </div>
        <FloorStackPicker
          floors={sortedFloors}
          selectedFloorId={selectedFloorId}
          onSelectFloor={(fid) => handleFacadeFloorPick(fid)}
        />
      </div>
    ) : null

  const sidebarEl = (
    <PublicBuildingSidebar
      layout={layout}
      selectedUnit={selectedStepShowsUnits ? selectedUnit : null}
      filters={filters}
      onFilterChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
      onResetFilters={() => setFilters({ ...defaultPlotFilters })}
      onZoomIn={() => setZoomInTrigger((n) => n + 1)}
      onZoomOut={() => setZoomOutTrigger((n) => n + 1)}
      onResetView={() => setResetZoomTrigger((n) => n + 1)}
      legendOpen={legendOpen}
      onToggleLegend={() => setLegendOpen((v) => !v)}
      bookingStep={publicStep}
      onSkipToFloorPlan={hasFacadeFlow ? handleSkipToFloorPlan : undefined}
    />
  )

  return (
    <>
      {/* Floating Controls */}
      <div className="floating-map-controls glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-xl)' }}>
        <button className="btn-icon btn-ghost" onClick={() => setZoomInTrigger(n => n + 1)} aria-label="Zoom in">+</button>
        <button className="btn-icon btn-ghost" onClick={() => setZoomOutTrigger(n => n + 1)} aria-label="Zoom out">−</button>
        <button className="btn-icon btn-ghost" onClick={() => setResetZoomTrigger(n => n + 1)} aria-label="Reset view">↺</button>
      </div>

      <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
        {publicStep === 'facade' && facadeImageSrc && (
          <ImagePlotMapView
            imageSrc={facadeImageSrc}
            overlayConfig={facadeOverlayFlat}
            plots={facadePlots}
            selectedPlot={selectedFacadePlot}
            onSelectPlot={(plot) => handleFacadeFloorPick(plot.id)}
            emptyMessage="Facade is not calibrated yet."
            zoomPanEnabled
            beforeMapSlot={beforeMapSlot}
            resetZoomTrigger={resetZoomTrigger}
            zoomInTrigger={zoomInTrigger}
            zoomOutTrigger={zoomOutTrigger}
          />
        )}

        {publicStep === 'config' && selectedFloorId && (
          <div className="public-building-config-layout image-plot-map-layout" style={{ width: '100%', height: '100%', padding: '2rem' }}>
            <ConfigurationPicker
                  configurations={currentFloor?.configurations || []}
                  floorLabel={currentFloor?.label || currentFloor?.id}
                  apiBase={API_BASE}
                  onBack={() => {
                    setPublicStep('facade')
                    setSelectedConfigId(null)
                  }}
                  onSelectConfig={(cfg) => {
                    setSelectedConfigId(cfg.id)
                    setPublicStep('units')
                    setSelectedUnit(null)
                  }}
                />
          </div>
        )}

        {publicStep === 'units' && (
          <ImagePlotMapView
            imageSrc={imageSrc}
            overlayConfig={floorOverlay}
            plots={filteredUnits}
            selectedPlot={selectedUnit}
            onSelectPlot={setSelectedUnit}
            emptyMessage={mapEmptyMessage}
            zoomPanEnabled
            beforeMapSlot={beforeMapSlot}
            resetZoomTrigger={resetZoomTrigger}
            zoomInTrigger={zoomInTrigger}
            zoomOutTrigger={zoomOutTrigger}
          />
        )}
      </div>

      {/* Drawer Overlay for Sidebars / Details */}
      {((publicStep === 'units' && selectedUnit) || publicStep === 'facade' || publicStep === 'config') && (
        <>
          {selectedUnit && (
            <div 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }} 
              onClick={() => setSelectedUnit(null)}
              className="mobile-only-backdrop"
            />
          )}
          <div className="premium-drawer">
            {selectedUnit && (
              <button 
                className="btn-icon btn-ghost" 
                style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 110 }}
                onClick={() => setSelectedUnit(null)}
              >
                ×
              </button>
            )}
            <div style={{ overflowY: 'auto', height: '100%' }}>
              {sidebarEl}
            </div>
          </div>
        </>
      )}
    </>
  )
}
