import { useState } from 'react'
import PlotDetailsPanelWithLead from './PlotDetailsPanelWithLead'
import Filters from './Filters'

/** Phase lines: badges (legacy) → multiline description → single layoutName subtitle */
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

export default function PublicSidebar({
  layout,
  selectedPlot,
  filters,
  onFilterChange,
  onResetFilters,
  onZoomIn,
  onZoomOut,
  onResetView,
  legendOpen,
  onToggleLegend,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [plotDetailsOpen, setPlotDetailsOpen] = useState(true)

  const toggleFiltersOpen = () => setFiltersOpen((v) => !v)
  const togglePlotDetailsOpen = () => setPlotDetailsOpen((v) => !v)

  const filtersActive =
    filters.availability !== 'All' ||
    filters.facing !== 'All' ||
    (filters.areas?.length ?? 0) > 0 ||
    (filters.prices?.length ?? 0) > 0

  return (
    <div className="public-sidebar" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflowY: 'auto', 
      overflowX: 'hidden',
      width: '100%', 
      maxWidth: '420px' 
    }}>
      <div className="public-sidebar-layout">
        <div className="public-sidebar-live" aria-live="polite">
          <span className="public-sidebar-live-dot" aria-hidden />
          <span>Live view</span>
        </div>
        <h2 className="public-sidebar-title">{layout?.name || 'Layout'}</h2>
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

      <div className="public-sidebar-filters-block">
        <div className="public-sidebar-filters-head">
          <button
            type="button"
            className="public-sidebar-filters-toggle"
            onClick={toggleFiltersOpen}
            aria-expanded={filtersOpen}
            id="public-filters-heading"
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
              aria-controls="public-filters-region"
              aria-label={filtersOpen ? 'Collapse filters' : 'Expand filters'}
            >
              <span aria-hidden>{filtersOpen ? '▾' : '▸'}</span>
            </button>
          </div>
        </div>
        {filtersOpen && (
          <div
            className="public-sidebar-filters-body"
            id="public-filters-region"
            role="region"
            aria-labelledby="public-filters-heading"
            style={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}
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

      <div className="public-sidebar-plot" style={{ height: 'auto', maxHeight: 'none', overflow: 'visible', flexShrink: 0, borderTop: '1px solid var(--color-border)' }}>
        <div className="public-sidebar-filters-head">
          <button
            type="button"
            className="public-sidebar-filters-toggle"
            onClick={togglePlotDetailsOpen}
            aria-expanded={plotDetailsOpen}
          >
            <span className="public-sidebar-filters-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </span>
            <span>Plot details</span>
          </button>
          <div className="public-sidebar-filters-head-actions">
            <button
              type="button"
              className="public-sidebar-filters-chevron-btn"
              onClick={togglePlotDetailsOpen}
              aria-label={plotDetailsOpen ? 'Collapse plot details' : 'Expand plot details'}
            >
              <span aria-hidden>{plotDetailsOpen ? '▾' : '▸'}</span>
            </button>
          </div>
        </div>
        {plotDetailsOpen && (
          <PlotDetailsPanelWithLead
            variant="sidebar"
            layout={layout}
            layoutLabel={layout?.phaseInfo?.layoutName || undefined}
            plot={selectedPlot ? { ...selectedPlot, layoutId: layout.id } : null}
          />
        )}
      </div>
    </div>
  )
}
