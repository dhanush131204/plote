import { useState } from 'react'
import PlotDetailsPanelWithLead from './PlotDetailsPanelWithLead'
import Filters from './Filters'

function PublicSidebarPhaseLines({ layout }) {
  const pi = layout?.phaseInfo || {}
  const badges = pi.badges || []
  const description = (pi.description ?? '').trim()
  const layoutName = (pi.layoutName ?? '').trim()

  if (badges.length > 0) {
    return badges.map((badge, i) => (
      <p key={`${badge}-${i}`} className="public-sidebar-phase">
        {badge}
      </p>
    ))
  }

  const lines = description
    ? description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : []
  if (lines.length > 0) {
    return lines.map((line, i) => (
      <p key={`phase-line-${i}`} className="public-sidebar-phase">
        {line}
      </p>
    ))
  }

  if (layoutName) {
    return <p className="public-sidebar-phase">{layoutName}</p>
  }

  return null
}

export default function PublicBuildingSidebar({
  layout,
  selectedUnit,
  filters,
  onFilterChange,
  onResetFilters,
  onZoomIn,
  onZoomOut,
  onResetView,
  legendOpen,
  onToggleLegend,
  bookingStep = 'units',
  onSkipToFloorPlan,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true)

  const toggleFiltersOpen = () => setFiltersOpen((v) => !v)

  const filtersActive =
    filters.availability !== 'All' ||
    filters.facing !== 'All' ||
    (filters.areas?.length ?? 0) > 0 ||
    (filters.prices?.length ?? 0) > 0

  return (
    <div className="public-sidebar">
      <div className="public-sidebar-layout">
        <div className="public-sidebar-live" aria-live="polite">
          <span className="public-sidebar-live-dot" aria-hidden />
          <span>Live view</span>
        </div>
        <h2 className="public-sidebar-title">{layout?.name || 'Building'}</h2>
        <PublicSidebarPhaseLines layout={layout} />
      </div>

      <div className="public-sidebar-toolbar" role="toolbar" aria-label="Map controls">
        <button type="button" className="public-sidebar-tool" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
          +
        </button>
        <button type="button" className="public-sidebar-tool" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
          −
        </button>
        <button type="button" className="public-sidebar-tool" onClick={onResetView} aria-label="Reset view" title="Reset view">
          ↺
        </button>
        <button
          type="button"
          className={`public-sidebar-tool ${legendOpen ? 'active' : ''}`}
          onClick={onToggleLegend}
          aria-label={legendOpen ? 'Hide status legend' : 'Show status legend'}
          aria-pressed={legendOpen}
          title="Legend"
        >
          i
        </button>
      </div>

      {bookingStep !== 'units' && (
        <div className="public-sidebar-booking-hint">
          {bookingStep === 'facade' && (
            <p>Select a floor on the building facade, use the floor list, or skip to the unit map.</p>
          )}
          {bookingStep === 'config' && <p>Pick 2 BHK or 3 BHK to see matching units on the floor plan.</p>}
          {bookingStep === 'facade' && onSkipToFloorPlan && (
            <button type="button" className="btn-secondary public-sidebar-skip" onClick={onSkipToFloorPlan}>
              Skip to unit map
            </button>
          )}
        </div>
      )}

      {bookingStep === 'units' && (
        <div className="public-sidebar-filters-block">
          <div className="public-sidebar-filters-head">
            <button
              type="button"
              className="public-sidebar-filters-toggle"
              onClick={toggleFiltersOpen}
              aria-expanded={filtersOpen}
              id="public-filters-heading-building"
            >
              <span className="public-sidebar-filters-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </span>
              <span>Filters</span>
              {filtersActive && <span className="public-sidebar-filters-badge" aria-hidden />}
            </button>
            <div className="public-sidebar-filters-head-actions">
              <button
                type="button"
                className="public-sidebar-filters-reset-head"
                onClick={(e) => {
                  e.stopPropagation()
                  onResetFilters()
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="public-sidebar-filters-chevron-btn"
                onClick={toggleFiltersOpen}
                aria-expanded={filtersOpen}
                aria-controls="public-filters-region-building"
                aria-label={filtersOpen ? 'Collapse filters' : 'Expand filters'}
              >
                <span aria-hidden>{filtersOpen ? '▾' : '▸'}</span>
              </button>
            </div>
          </div>
          {filtersOpen && (
            <div
              className="public-sidebar-filters-body"
              id="public-filters-region-building"
              role="region"
              aria-labelledby="public-filters-heading-building"
            >
              <Filters
                filters={filters}
                onFilterChange={onFilterChange}
                onReset={onResetFilters}
                hideResetButton
                hideTitle
              />
            </div>
          )}
        </div>
      )}

      <div className="public-sidebar-plot">
        <p className="public-sidebar-section-label">Unit details</p>
        <PlotDetailsPanelWithLead
          variant="sidebar"
          layout={layout}
          isBuilding
          layoutLabel={layout?.phaseInfo?.layoutName || undefined}
          plot={selectedUnit ? { ...selectedUnit, layoutId: layout.id } : null}
        />
      </div>
    </div>
  )
}
