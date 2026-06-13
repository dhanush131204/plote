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
  onSelectPlot,
  filters,
  onFilterChange,
  onResetFilters,
  onZoomIn,
  onZoomOut,
  onResetView,
  legendOpen,
  onToggleLegend,
  onClearSelection
}) {
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
      <div style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0a8870', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0a8870' }}>Live Inventory</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#0f172a', lineHeight: 1.2 }}>{layout?.name || 'Untitled'}</h2>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          <PublicSidebarPhaseLines layout={layout} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button type="button" className="public-sidebar-tool" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in" style={{ width: '100%', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s', color: '#475569' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button type="button" className="public-sidebar-tool" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out" style={{ width: '100%', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s', color: '#475569' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button type="button" className="public-sidebar-tool" onClick={onResetView} aria-label="Reset view" title="Reset view" style={{ width: '100%', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s', color: '#475569' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M16 3h5v5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 21H3v-5"></path></svg>
          </button>
          <button
            type="button"
            className={`public-sidebar-tool ${legendOpen ? 'active' : ''}`}
            onClick={onToggleLegend}
            aria-label={legendOpen ? 'Hide status legend' : 'Show status legend'}
            aria-pressed={legendOpen}
            title="Legend"
            style={{ width: '100%', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: legendOpen ? '#0a8870' : '#fff', color: legendOpen ? '#fff' : '#475569', border: '1px solid', borderColor: legendOpen ? '#0a8870' : '#e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedPlot ? (
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
              layoutLabel={layout?.phaseInfo?.layoutName || undefined}
              plot={{ ...selectedPlot, layoutId: layout.id }}
              onSelectPlot={onSelectPlot}
            />
          </div>
        ) : (
          <div style={{ padding: '0 1.5rem' }}>
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
          </div>
        )}
      </div>
    </div>
  )
}
