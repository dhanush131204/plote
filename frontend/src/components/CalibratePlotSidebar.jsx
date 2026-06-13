import { useState } from 'react'

const formatPrice = (num) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num || 0)

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'Booked', label: 'Booked' },
  { value: 'Sold', label: 'Sold' },
]

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
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredPlots = statusFilter === 'all'
    ? plots
    : plots.filter((p) => (p.status || 'Available') === statusFilter)

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
      <div className="calibrate-sidebar-filters">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`calibrate-filter-chip ${statusFilter === value ? 'active' : ''}`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="calibrate-plot-list">
        {filteredPlots.map((plot) => {
          const isCalibrated = overlayConfig[plot.number]?.points?.length === 4
          const isSelected = calibratePlotNum === plot.number
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
                      if (window.confirm(`Delete plot #${plot.number}?`)) onDeletePlot?.(plot)
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
    </div>
  )
}
