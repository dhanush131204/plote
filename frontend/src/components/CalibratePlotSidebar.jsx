import { useState } from 'react'

const formatPrice = (num) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num || 0)

export default function CalibratePlotSidebar({
  plots = [],
  overlayConfig = {},
  calibratePlotNum,
  onCalibratePlotNumChange,
  onUpdatePlot,
  onEditPlot,
  onDeletePlot,
  calibPoints = [],
  title = 'Plots',
  emptyHint = 'Add a plot using "Add new plot" above, then click 4 corners on the map to calibrate.',
}) {
  const [plotToDelete, setPlotToDelete] = useState(null)

  if (plots.length === 0) {
    return (
      <div className="calibrate-sidebar calibrate-sidebar-empty">
        <p>{emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="calibrate-sidebar">
      <h3 className="calibrate-sidebar-title">{title}</h3>
      {plots.length > 0 && (
        <>
          <p className="calibrate-sidebar-hint">
            Click 4 corners on map for {(() => {
              const activePlot = plots.find((p) => String(p.number) === String(calibratePlotNum));
              return activePlot?.label || `plot #${calibratePlotNum}`;
            })()} · {calibPoints.length}/4
          </p>
          <p className="calibrate-sidebar-hint calibrate-sidebar-zoom-hint">
            Scroll to zoom · Drag to pan · Double-click to reset
          </p>
        </>
      )}
      <ul className="calibrate-plot-list">
        {plots.map((plot) => {
          const isCalibrated = overlayConfig[plot.number]?.points?.length === 4
          const isSelected = String(calibratePlotNum) === String(plot.number)
          const estPrice = plot.areaSqft && plot.pricePerSqft
            ? plot.areaSqft * plot.pricePerSqft
            : plot.estimatedPrice

          return (
            <li
              key={plot.id}
              className={`calibrate-plot-item ${isSelected ? 'selected' : ''} ${isCalibrated ? 'calibrated' : ''}`}
            >
              <div className="calibrate-plot-header">
                <button
                  type="button"
                  className="calibrate-plot-select"
                  onClick={() => onCalibratePlotNumChange?.(plot.number)}
                  title={isCalibrated ? 'Already calibrated' : 'Click to calibrate this plot'}
                >
                  <span className="calibrate-plot-num">{plot.label || `${plot.prefix !== undefined ? plot.prefix : 'Unit'} ${plot.number}`}</span>
                  {isCalibrated ? (
                    <span className="calibrate-badge" aria-label="Calibrated">✓</span>
                  ) : (
                    <span className="calibrate-badge calibrate-badge-pending">Mark</span>
                  )}
                </button>
                <div className="calibrate-plot-actions">
                  <button
                    type="button"
                    className="calibrate-plot-edit-btn"
                    onClick={() => onEditPlot?.(plot)}
                    title="Edit plot details"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="calibrate-plot-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPlotToDelete(plot)
                    }}
                    title="Delete plot"
                    aria-label={`Delete plot ${plot.number}`}
                  >
                    <span aria-hidden>🗑</span>
                  </button>
                </div>
              </div>
              {title !== 'Facade floors' && (
                <div className="calibrate-plot-details">
                  <div className="calibrate-plot-row">
                    <span>Area:</span>
                    <span>{plot.areaCent} cent · {plot.areaSqft?.toLocaleString() ?? 0} sqft</span>
                  </div>
                  <div className="calibrate-plot-row">
                    <span>Facing:</span>
                    <span>{plot.facing}</span>
                  </div>
                  <div className="calibrate-plot-row">
                    <span>Status:</span>
                    <span className={`status-${(plot.status || 'available').toLowerCase()}`}>{plot.status}</span>
                  </div>
                  <div className="calibrate-plot-row calibrate-plot-row-price">
                    <label>
                      <span>₹/sqft</span>
                      <input
                        type="number"
                        min={0}
                        value={plot.pricePerSqft ?? ''}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          const pps = isNaN(v) ? 0 : v
                          const est = (plot.areaSqft || 0) * pps
                          onUpdatePlot?.({ ...plot, pricePerSqft: pps, estimatedPrice: est })
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </label>
                  </div>
                  <div className="calibrate-plot-row calibrate-plot-est">
                    <span>Est. price</span>
                    <span>{formatPrice(estPrice)}</span>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {plotToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setPlotToDelete(null)} />
          <div className="modal-content delete-confirm-popup" style={{ maxWidth: '400px', padding: '1.5rem', borderRadius: '12px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', padding: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text)' }}>
                Delete {title === 'Facade floors' ? 'Floor' : 'Plot/Unit'}
              </h3>
            </div>
            <div className="modal-body" style={{ padding: '1rem 0 1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Are you sure you want to delete {plotToDelete.prefix !== undefined ? plotToDelete.prefix : 'Unit'} {plotToDelete.number}? This action cannot be undone.
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPlotToDelete(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  onDeletePlot?.(plotToDelete)
                  setPlotToDelete(null)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
