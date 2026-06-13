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
  onClearSelection
}) {
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
      background: '#ffffff',
      paddingBottom: '2rem'
    }}>
      <div style={{ padding: '2rem 1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a8870', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0a8870' }}>Live Inventory</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#1e293b', lineHeight: 1.1 }}>{layout?.name || 'Building'}</h2>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
          <PublicSidebarPhaseLines layout={layout} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          <button type="button" className="public-sidebar-tool" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in" style={{ width: '100%', height: '2.5rem' }}>
            +
          </button>
          <button type="button" className="public-sidebar-tool" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out" style={{ width: '100%', height: '2.5rem' }}>
            −
          </button>
          <button type="button" className="public-sidebar-tool" onClick={onResetView} aria-label="Reset view" title="Reset view" style={{ width: '100%', height: '2.5rem' }}>
            ↺
          </button>
          <button
            type="button"
            className={`public-sidebar-tool ${legendOpen ? 'active' : ''}`}
            onClick={onToggleLegend}
            aria-label={legendOpen ? 'Hide status legend' : 'Show status legend'}
            aria-pressed={legendOpen}
            title="Legend"
            style={{ width: '100%', height: '2.5rem', background: legendOpen ? '#0a8870' : '#fff', color: legendOpen ? '#fff' : '#1f2a3d', borderColor: legendOpen ? '#0a8870' : undefined }}
          >
            i
          </button>
        </div>

        {bookingStep !== 'units' && (
          <div className="public-sidebar-booking-hint" style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
            {bookingStep === 'facade' && (
              <p style={{ margin: 0 }}>Select a floor on the building facade, use the floor list, or skip to the unit map.</p>
            )}
            {bookingStep === 'config' && <p style={{ margin: 0 }}>Pick 2 BHK or 3 BHK to see matching units on the floor plan.</p>}
            {bookingStep === 'facade' && onSkipToFloorPlan && (
              <button 
                type="button" 
                className="btn-secondary public-sidebar-skip" 
                onClick={onSkipToFloorPlan} 
                style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
              >
                Skip to unit map
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUnit ? (
          <div style={{ padding: '0 1.5rem', animation: 'fadeIn 0.3s ease' }}>
            <button 
              onClick={onClearSelection}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: '0 0 1rem 0' }}
            >
              ← Back to Filters
            </button>
            <PlotDetailsPanelWithLead
              variant="sidebar"
              layout={layout}
              isBuilding
              layoutLabel={layout?.phaseInfo?.layoutName || undefined}
              plot={{ ...selectedUnit, layoutId: layout.id }}
            />
          </div>
        ) : (
          <div style={{ padding: '0 1.5rem' }}>
            {bookingStep === 'units' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                    Filters
                  </div>
                  <button
                    type="button"
                    onClick={onResetFilters}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reset All
                  </button>
                </div>
                <Filters
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onReset={onResetFilters}
                  hideResetButton
                  hideTitle
                />
              </>
            )}
            
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <PlotDetailsPanelWithLead
                variant="sidebar"
                layout={layout}
                isBuilding
                plot={null}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
