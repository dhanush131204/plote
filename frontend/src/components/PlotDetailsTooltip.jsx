export default function PlotDetailsTooltip({ plot }) {
  if (!plot) return null

  const formatPrice = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div className="plot-details-tooltip">
      <div className="tooltip-header">Plot #{plot.number}</div>
      <div className="tooltip-row">
        <span className="tooltip-label">Area (Cent)</span>
        <span className="tooltip-value">{plot.areaCent}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Area (Sqft)</span>
        <span className="tooltip-value">{plot.areaSqft.toLocaleString()}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Facing</span>
        <span className="tooltip-value">{plot.facing}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Status</span>
        <span className={`tooltip-value status-${plot.status.toLowerCase()}`}>{plot.status}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Price</span>
        <span className="tooltip-value">₹{plot.pricePerSqft.toLocaleString()}/sqft</span>
      </div>
      <div className="tooltip-row highlight">
        <span className="tooltip-label">Estimated Price</span>
        <span className="tooltip-value">{formatPrice(plot.estimatedPrice)}</span>
      </div>
      <div className="tooltip-actions">
        <button type="button" className="tooltip-share-btn">Share via WhatsApp</button>
        <button type="button" className="tooltip-share-btn">Share via SMS</button>
      </div>
    </div>
  )
}
