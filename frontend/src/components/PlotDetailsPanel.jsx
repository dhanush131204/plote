export default function PlotDetailsPanel({ plot }) {
  if (!plot) {
    return (
      <div className="plot-details-panel plot-details-panel-empty">
        <p>Click on a plot on the map to view details.</p>
      </div>
    )
  }

  const formatPrice = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div className="plot-details-panel">
      <h3 className="panel-title">Plot #{plot.number}</h3>
      <div className="panel-row">
        <span className="panel-label">Area (Cent)</span>
        <span className="panel-value">{plot.areaCent}</span>
      </div>
      <div className="panel-row">
        <span className="panel-label">Area (Sqft)</span>
        <span className="panel-value">{plot.areaSqft.toLocaleString()}</span>
      </div>
      <div className="panel-row">
        <span className="panel-label">Facing</span>
        <span className="panel-value">{plot.facing}</span>
      </div>
      <div className="panel-row">
        <span className="panel-label">Status</span>
        <span className={`panel-value status-${plot.status.toLowerCase()}`}>{plot.status}</span>
      </div>
      <div className="panel-row">
        <span className="panel-label">Price</span>
        <span className="panel-value">₹{plot.pricePerSqft.toLocaleString()}/sqft</span>
      </div>
      <div className="panel-row panel-row-highlight">
        <span className="panel-label">Estimated Price</span>
        <span className="panel-value">{formatPrice(plot.estimatedPrice)}</span>
      </div>
      <p className="panel-note">* Note: GST charges extra as applicable</p>
      <div className="panel-form">
        <input type="text" placeholder="Customer Name" className="panel-input" />
        <input type="tel" placeholder="Contact Number" className="panel-input" />
      </div>
      <div className="panel-actions">
        <button type="button" className="panel-share-btn">Share via WhatsApp</button>
        <button type="button" className="panel-share-btn">Share via SMS</button>
      </div>
    </div>
  )
}
