import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCreateLeadMutation } from '../api/apiSlice'
import PlotQuickActions from './PlotQuickActions'

export default function PlotDetailsPanelWithLead({ plot, variant = 'default', layoutLabel, layout, isBuilding = false, onSelectPlot }) {
  const [interestModalOpen, setInterestModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [createLead, { isLoading: loading }] = useCreateLeadMutation()
  const [error, setError] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [showToast])

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [submitted])

  useEffect(() => {
    if (!plot?.id) return
    const saved = JSON.parse(localStorage.getItem('savedPlots') || '[]')
    setIsSaved(saved.some(p => p.id === plot.id))
  }, [plot?.id])

  const handleSavePlot = () => {
    const saved = JSON.parse(localStorage.getItem('savedPlots') || '[]')
    if (isSaved) {
      const next = saved.filter(p => p.id !== plot.id)
      localStorage.setItem('savedPlots', JSON.stringify(next))
      setIsSaved(false)
    } else {
      saved.push({ ...plot, layoutName: layout?.name, layoutSlug: layout?.slug })
      localStorage.setItem('savedPlots', JSON.stringify(saved))
      setIsSaved(true)
    }
  }

  const handleCompare = () => {
    alert('Added to compare list!')
  }

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
      const res = await createLead({
        layoutId: plot.layoutId,
        plotId: plot.id,
        customerName: customerName.trim(),
        contactNumber: contactNumber.trim(),
        customerEmail: customerEmail.trim(),
      }).unwrap()
      
      if (res.trackingId) {
        const tracked = JSON.parse(localStorage.getItem('trackedLeads') || '[]')
        // Prepend new tracking info
        tracked.unshift({
          trackingId: res.trackingId,
          layoutName: layout?.name || 'Project',
          plotNumber: plot.number,
          layoutSlug: layout?.slug,
          plotId: plot.id,
          submittedDate: new Date().toISOString()
        })
        localStorage.setItem('trackedLeads', JSON.stringify(tracked))
      }

      setSubmitted(true)
      setInterestModalOpen(false)
      setShowToast(true)
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

  const toastNotification =
    showToast &&
    createPortal(
      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
          background: 'rgba(10, 136, 112, 0.95)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '1rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(10, 136, 112, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: '600',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-sans, sans-serif)',
          animation: 'slideDownFade 0.3s ease-out',
          maxWidth: '90%',
          width: 'max-content'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>You have successfully submitted your interest!</span>
        <button
          onClick={() => setShowToast(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0 0 0 0.5rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            marginLeft: 'auto'
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>,
      document.body
    )

  if (!plot) {
    return (
      <div 
        className={`plot-mobile-card plot-mobile-card-empty ${variant === 'sidebar' ? 'plot-mobile-card--sidebar-empty' : ''}`}
        style={{ 
          height: 'auto', 
          minHeight: '180px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '1.5rem' 
        }}
      >
        <p>Select {isBuilding ? 'a unit' : 'a plot'} on the map to view details.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <>
        <div 
          className={`plot-mobile-card ${variant === 'sidebar' ? 'plot-mobile-card--sidebar' : ''}`}
          style={{ 
            height: 'auto', 
            minHeight: '180px', 
            padding: '1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            gap: '1rem' 
          }}
        >
          <h3 className="panel-title">Thank you!</h3>
          <p>
            We have received your interest for {isBuilding ? 'Unit' : 'Plot'} #{plot.number}. We will contact you shortly.
          </p>
        </div>
        {toastNotification}
      </>
    )
  }

  return (
    <>
      <div 
        className={cardClass}
        style={{
          height: 'auto',
          minHeight: '180px',
          overflow: 'visible',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {variant === 'sidebar' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ 
                color: plot.status === 'Available' ? '#0a8870' : '#64748b', 
                fontWeight: 700, 
                fontSize: '0.875rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em' 
              }}>
                {plot.status || 'Available'}
              </span>
              <h3 style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '1.75rem', 
                fontWeight: 800, 
                margin: '0', 
                lineHeight: 1,
                color: '#1e293b'
              }}>
                {isBuilding ? 'Unit' : 'Plot'} <span style={{ color: '#1e293b' }}>{plot.number}</span>
              </h3>
              {isBuilding && (plot.floor != null || plot.tower || plot.beds != null) && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                  {plot.floor != null && <>Floor {plot.floor}</>}
                  {plot.tower ? <> · Tower {plot.tower}</> : null}
                  {plot.beds != null ? <> · {plot.beds} BR</> : null}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total area</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{plot.areaCent} Cent</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>~ {(plot.areaSqft || 0).toLocaleString()} sqft</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Facing</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{plot.facing || 'N/A'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. price</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{formatPrice(plot.estimatedPrice)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price / sqft</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>₹{(plot.pricePerSqft || 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={handleSavePlot} 
                style={{ 
                  flex: 1, 
                  background: isSaved ? '#f0fdf4' : '#fff', 
                  border: isSaved ? '1px solid #22c55e' : '1px solid #e2e8f0', 
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isSaved ? '#16a34a' : '#334155',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSaved ? '💚 Saved' : '🤍 Save'}
              </button>
              <button 
                type="button" 
                onClick={handleCompare} 
                style={{ 
                  flex: 1, 
                  background: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#334155',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                ⚖️ Compare
              </button>
            </div>

            <PlotQuickActions
              phone={contactPhone}
              whatsappNumber={whatsappNumber}
              plotLabel={`${isBuilding ? 'Unit' : 'Plot'} ${plot.number} — ${layout?.name || 'Layout'}`}
            />

            {plot.status === 'Sold' || plot.status === 'Booked' ? (
              <div style={{
                width: '100%',
                padding: '1rem',
                background: plot.status === 'Sold' ? '#fef2f2' : '#fffbeb',
                color: plot.status === 'Sold' ? '#ef4444' : '#d97706',
                border: `1px solid ${plot.status === 'Sold' ? '#fecaca' : '#fde68a'}`,
                borderRadius: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                textAlign: 'center',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                🔒 This {isBuilding ? 'unit' : 'plot'} is {plot.status}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setInterestModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#0a8870',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  boxShadow: '0 4px 12px rgba(10, 136, 112, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                Submit interest
              </button>
            )}

            {layout?.plots?.length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '1rem', margin: 0 }}>
                  Similar {isBuilding ? 'Units' : 'Plots'}
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                  {layout.plots
                    .filter(p => p.id !== plot.id && p.status === 'Available' && Math.abs((p.estimatedPrice || 0) - (plot.estimatedPrice || 0)) < 500000)
                    .slice(0, 3)
                    .map(sim => (
                      <div 
                        key={sim.id} 
                        onClick={() => onSelectPlot?.(sim)}
                        className="similar-plot-card-clickable"
                        style={{ 
                          minWidth: '140px', 
                          padding: '1rem', 
                          flexShrink: 0,
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.25rem', color: '#0f172a' }}>{isBuilding ? 'Unit' : 'Plot'} {sim.number}</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{formatPrice(sim.estimatedPrice)}</p>
                      </div>
                    ))
                  }
                  {layout.plots.filter(p => p.id !== plot.id && p.status === 'Available' && Math.abs((p.estimatedPrice || 0) - (plot.estimatedPrice || 0)) < 500000).length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>No similar {isBuilding ? 'units' : 'plots'} available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
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
              {plot.status === 'Sold' || plot.status === 'Booked' ? (
                <div style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: plot.status === 'Sold' ? '#fef2f2' : '#fffbeb',
                  color: plot.status === 'Sold' ? '#ef4444' : '#d97706',
                  border: `1px solid ${plot.status === 'Sold' ? '#fecaca' : '#fde68a'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  🔒 This {isBuilding ? 'unit' : 'plot'} is {plot.status}
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-panel-expand btn-submit-interest-trigger"
                  onClick={() => setInterestModalOpen(true)}
                >
                  Submit interest
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {interestModal}
      {toastNotification}
    </>
  )
}
