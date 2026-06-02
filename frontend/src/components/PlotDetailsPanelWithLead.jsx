import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCreateLeadMutation } from '../api/apiSlice'
import PlotQuickActions from './PlotQuickActions'

export default function PlotDetailsPanelWithLead({ plot, variant = 'default', layoutLabel, layout, isBuilding = false }) {
  const [interestModalOpen, setInterestModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [createLead, { isLoading: loading }] = useCreateLeadMutation()
  const [error, setError] = useState('')

  const phaseInfo = layout?.phaseInfo || {}
  const contactPhone = phaseInfo.phone || phaseInfo.contactPhone || ''
  const whatsappNumber = phaseInfo.whatsapp || phaseInfo.whatsappNumber || contactPhone

  useEffect(() => {
    if (!plot?.id) return
    setInterestModalOpen(false)
    setSubmitted(false)
    setCustomerName('')
    setContactNumber('')
    setCustomerEmail('')
    setError('')
  }, [plot?.id])

  useEffect(() => {
    if (!interestModalOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setInterestModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [interestModalOpen])

  const formatPrice = (num) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerName.trim() || !contactNumber.trim() || !customerEmail.trim()) {
      setError('Please fill in your name, phone, and email')
      return
    }
    setError('')
    try {
      await createLead({
        layoutId: plot.layoutId,
        plotId: plot.id,
        customerName: customerName.trim(),
        contactNumber: contactNumber.trim(),
        customerEmail: customerEmail.trim(),
      }).unwrap()
      setSubmitted(true)
      setInterestModalOpen(false)
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to submit')
    }
  }

  const cardClass = variant === 'sidebar' ? 'plot-mobile-card plot-mobile-card--sidebar' : 'plot-mobile-card'

  const interestModal =
    interestModalOpen &&
    plot &&
    createPortal(
      <div
        className="plot-interest-modal-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plot-interest-modal-title"
      >
        <button
          type="button"
          className="plot-interest-modal-backdrop"
          aria-label="Close"
          onClick={() => setInterestModalOpen(false)}
        />
        <div className="plot-interest-modal">
          <div className="plot-interest-modal-header">
            <h2 id="plot-interest-modal-title" className="plot-interest-modal-title">
              Submit interest
            </h2>
            <p className="plot-interest-modal-sub">
              {isBuilding ? 'Unit' : 'Plot'} #{plot.number}
              {isBuilding && (plot.floor != null || plot.tower) ? (
                <>
                  {' '}
                  · Floor {plot.floor ?? '—'}
                  {plot.tower ? ` · ${plot.tower}` : ''}
                </>
              ) : null}
              {layout?.name ? ` · ${layout.name}` : ''}
            </p>
            <button
              type="button"
              className="plot-interest-modal-close"
              onClick={() => setInterestModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <form className="plot-interest-modal-form" onSubmit={handleSubmit}>
            {error && <div className="panel-inline-error">{error}</div>}
            <label className="plot-interest-label">
              <span className="sr-only">Your name</span>
              <input
                type="text"
                placeholder="Your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="panel-input"
                required
                autoComplete="name"
                autoFocus
              />
            </label>
            <label className="plot-interest-label">
              <span className="sr-only">Contact number</span>
              <input
                type="tel"
                placeholder="Contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="panel-input"
                required
                autoComplete="tel"
              />
            </label>
            <label className="plot-interest-label">
              <span className="sr-only">Email</span>
              <input
                type="email"
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="panel-input"
                required
                autoComplete="email"
              />
            </label>
            <button type="submit" className="btn-primary btn-submit-interest" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit interest'}
            </button>
          </form>
        </div>
      </div>,
      document.body
    )

  if (!plot) {
    return (
      <div className={`plot-mobile-card plot-mobile-card-empty ${variant === 'sidebar' ? 'plot-mobile-card--sidebar-empty' : ''}`}>
        <p>Select {isBuilding ? 'a unit' : 'a plot'} on the map to view details.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className={`plot-mobile-card ${variant === 'sidebar' ? 'plot-mobile-card--sidebar' : ''}`}>
        <h3 className="panel-title">Thank you!</h3>
        <p>
          We have received your interest for {isBuilding ? 'Unit' : 'Plot'} #{plot.number}. We will contact you shortly.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={cardClass}>
        {variant === 'sidebar' ? (
          <>
            <div className="plot-detail-hero">
              <div className="plot-detail-hero-top">
                <span className={`plot-detail-status-pill status-${(plot.status || 'available').toLowerCase()}`}>
                  {plot.status || 'Available'}
                </span>
              </div>
              <div className="plot-detail-title-block">
                <span className="plot-detail-ghost" aria-hidden>
                  {plot.number}
                </span>
                <h3 className="plot-detail-title">
                  {isBuilding ? 'Unit' : 'Plot'}: <span className="plot-detail-title-num">{plot.number}</span>
                </h3>
                {isBuilding && (plot.floor != null || plot.tower || plot.beds != null) && (
                  <p className="plot-detail-phase plot-detail-unit-meta">
                    {plot.floor != null && <>Floor {plot.floor}</>}
                    {plot.tower ? <> · Tower {plot.tower}</> : null}
                    {plot.beds != null ? <> · {plot.beds} BR</> : null}
                  </p>
                )}
                {layoutLabel && <p className="plot-detail-phase">{layoutLabel}</p>}
                <p className="plot-detail-tagline">Use the buttons below to share or contact us, or submit your interest.</p>
              </div>
            </div>

            <div className="plot-detail-metrics" role="group" aria-label="Plot summary">
              <div className="plot-detail-metric">
                <span className="plot-detail-metric-label">Total area</span>
                <span className="plot-detail-metric-value">
                  {plot.areaCent} Cent
                  <span className="plot-detail-metric-sub">~ {(plot.areaSqft || 0).toLocaleString()} sqft</span>
                </span>
              </div>
              <div className="plot-detail-metric">
                <span className="plot-detail-metric-label">Facing</span>
                <span className="plot-detail-metric-value">{plot.facing || 'N/A'}</span>
              </div>
            </div>

            <div className="plot-detail-price-band">
              <div className="plot-detail-price-row">
                <span className="plot-detail-metric-label">Est. price</span>
                <span className="plot-detail-price-main">{formatPrice(plot.estimatedPrice)}</span>
              </div>
              <div className="plot-detail-price-row plot-detail-price-row--sub">
                <span className="plot-detail-metric-label">Price / sqft</span>
                <span className="plot-detail-price-per">₹{(plot.pricePerSqft || 0).toLocaleString()}</span>
              </div>
            </div>

            <PlotQuickActions
              phone={contactPhone}
              whatsappNumber={whatsappNumber}
              plotLabel={`${isBuilding ? 'Unit' : 'Plot'} ${plot.number} — ${layout?.name || 'Layout'}`}
            />

            <button
              type="button"
              className="btn-panel-expand btn-submit-interest-trigger"
              onClick={() => setInterestModalOpen(true)}
            >
              Submit interest
            </button>
          </>
        ) : (
          <>
            <div className="plot-mobile-card-head">
              <h3 className="panel-title">
                {isBuilding ? 'Unit' : 'Phase 1 - Plot'}: {plot.number}
              </h3>
            </div>
            <div className="plot-details-compact-summary">
              <div className="panel-row panel-row-compact">
                <span className="panel-label">Area</span>
                <span className="panel-value">{plot.areaCent} Cent</span>
              </div>
              <div className="panel-row panel-row-compact">
                <span className="panel-label">Facing</span>
                <span className="panel-value">{plot.facing || 'N/A'}</span>
              </div>
              <div className="panel-row panel-row-compact panel-row-highlight-compact">
                <span className="panel-label">Status</span>
                <span className={`panel-value status-${(plot.status || 'available').toLowerCase()}`}>{plot.status || 'Available'}</span>
              </div>
              <div className="panel-row panel-row-compact">
                <span className="panel-label">Estimated Price</span>
                <span className="panel-value panel-value-price">{formatPrice(plot.estimatedPrice)}</span>
              </div>
              <PlotQuickActions
                phone={contactPhone}
                whatsappNumber={whatsappNumber}
                plotLabel={`${isBuilding ? 'Unit' : 'Plot'} ${plot.number} — ${layout?.name || 'Layout'}`}
              />
              <button
                type="button"
                className="btn-panel-expand btn-submit-interest-trigger"
                onClick={() => setInterestModalOpen(true)}
              >
                Submit interest
              </button>
            </div>
          </>
        )}
      </div>
      {interestModal}
    </>
  )
}
