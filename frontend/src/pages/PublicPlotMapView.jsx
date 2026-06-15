import { useState, useEffect, useMemo } from 'react'
import ImagePlotMapView from '../components/ImagePlotMapView'
import { usePublicActivity } from '../hooks/usePublicActivity'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { useCreateLeadMutation } from '../api/apiSlice'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PublicPlotMapView({ layout }) {
  const [createLead] = useCreateLeadMutation()
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [hoveredPlot, setHoveredPlot] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [compareList, setCompareList] = useState([])
  const [compareOpen, setCompareOpen] = useState(false)
  
  // Advanced Filter States
  const [priceRange, setPriceRange] = useState([0, 5000000]) // default, recalculated on load
  const [areaRange, setAreaRange] = useState([0, 15]) // default Cent, recalculated on load
  const [selectedFacings, setSelectedFacings] = useState([]) // empty means 'All'
  const [selectedAvailabilities, setSelectedAvailabilities] = useState([]) // empty means 'All'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPanelOpen, setFilterPanelOpen] = useState(true)

  const [resetZoomTrigger, setResetZoomTrigger] = useState(0)
  const [zoomInTrigger, setZoomInTrigger] = useState(0)
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingType, setBookingType] = useState('Booking') // 'Booking' or 'Site Visit'
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submittingBooking, setSubmittingBooking] = useState(false)

  const { logPlotSelect } = usePublicActivity(layout?.id, layout?.layoutKind || 'plot')

  // Calculate dynamic filter boundaries from actual data
  const plotsList = useMemo(() => layout?.plots || [], [layout?.plots])
  
  const minMaxValues = useMemo(() => {
    if (plotsList.length === 0) return { maxPrice: 10000000, maxArea: 20 }
    let maxPrice = 0
    let maxArea = 0
    plotsList.forEach(p => {
      if (p.estimatedPrice > maxPrice) maxPrice = p.estimatedPrice
      if (p.areaCent > maxArea) maxArea = p.areaCent
    })
    return {
      maxPrice: maxPrice || 10000000,
      maxArea: maxArea || 20
    }
  }, [plotsList])

  // Set initial filter ranges on load
  useEffect(() => {
    setPriceRange([0, minMaxValues.maxPrice])
    setAreaRange([0, minMaxValues.maxArea])
  }, [minMaxValues])

  useEffect(() => {
    logPlotSelect(selectedPlot)
  }, [selectedPlot, logPlotSelect])

  // Count Dashboard Statistics
  const stats = useMemo(() => {
    const total = plotsList.length
    const available = plotsList.filter(p => p.status === 'Available' || !p.status).length
    const booked = plotsList.filter(p => p.status === 'Booked').length
    const sold = plotsList.filter(p => p.status === 'Sold').length
    return { total, available, booked, sold }
  }, [plotsList])

  // Apply filters locally with high precision
  const filteredPlots = useMemo(() => {
    return plotsList.filter(plot => {
      // 1. Availability Filter
      if (selectedAvailabilities.length > 0) {
        const status = plot.status || 'Available'
        if (!selectedAvailabilities.includes(status)) return false
      }
      
      // 2. Facing Filter
      if (selectedFacings.length > 0) {
        if (!selectedFacings.includes(plot.facing)) return false
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const numStr = String(plot.number).toLowerCase()
        if (!numStr.includes(searchQuery.toLowerCase().trim())) return false
      }

      // 4. Price Range Slider
      const price = plot.estimatedPrice || 0
      if (price < priceRange[0] || price > priceRange[1]) return false

      // 5. Area Range Slider (Cent)
      const area = plot.areaCent || 0
      if (area < areaRange[0] || area > areaRange[1]) return false

      return true
    })
  }, [plotsList, selectedAvailabilities, selectedFacings, searchQuery, priceRange, areaRange])

  const clearAllFilters = () => {
    setPriceRange([0, minMaxValues.maxPrice])
    setAreaRange([0, minMaxValues.maxArea])
    setSelectedFacings([])
    setSelectedAvailabilities([])
    setSearchQuery('')
  }

  // Handle Hover preview popup
  const handleHoverPlot = (plot, e) => {
    if (plot) {
      setHoveredPlot(plot)
      if (e) {
        // Adjust relative positions to float tooltip elegantly
        setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 })
      }
    } else {
      setHoveredPlot(null)
    }
  }

  // Handle comparison actions
  const toggleCompare = (plot) => {
    let message = ''
    let isError = false
    setCompareList(prev => {
      const exists = prev.find(p => p.id === plot.id)
      if (exists) {
        message = `Removed Plot ${plot.number} from comparison`
        return prev.filter(p => p.id !== plot.id)
      }
      if (prev.length >= 3) {
        message = 'You can compare a maximum of 3 plots at once.'
        isError = true
        return prev
      }
      message = `Added Plot ${plot.number} to comparison`
      return [...prev, plot]
    })

    if (message) {
      if (isError) {
        toast.error(message)
      } else {
        toast.success(message)
      }
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!bookingForm.name.trim() || !bookingForm.phone.trim() || !bookingForm.email.trim()) {
      toast.error('Please fill in all details.')
      return
    }
    setSubmittingBooking(true)
    try {
      await createLead({
        layoutId: layout.id,
        plotId: selectedPlot?.id || selectedPlot?.number,
        customerName: bookingForm.name.trim(),
        contactNumber: bookingForm.phone.trim(),
        customerEmail: bookingForm.email.trim(),
        metadata: JSON.stringify({ 
          message: bookingForm.message.trim(),
          inquiryType: bookingType
        })
      }).unwrap()
      const successMsg = bookingType === 'Booking' 
        ? `Booking request received for Plot ${selectedPlot?.number}! We will contact you shortly.`
        : `Site visit request received for Plot ${selectedPlot?.number}! We will contact you shortly.`
      toast.success(successMsg)
      setBookingModalOpen(false)
      setBookingForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      console.error(err)
      toast.error(err.data?.error || err.message || 'Failed to submit request.')
    } finally {
      setSubmittingBooking(false)
    }
  }

  if (!layout) return null
  const imageSrc = layout.imagePath ? `${API_BASE}/uploads/${layout.imagePath}` : null

  // Simulated premium properties for drawer
  const getSimulatedDetails = (plot) => {
    if (!plot) return {}
    const num = parseInt(plot.number, 10) || 1
    const roadWidth = num % 2 === 0 ? '12 Meter Wide Road' : '9 Meter Wide Road'
    const isCorner = num % 3 === 0 ? 'Yes (Corner Lot)' : 'No'
    const areaSqm = parseFloat(((plot.areaSqft || plot.areaCent * 435.6) / 10.764).toFixed(1))
    const areaSqft = plot.areaSqft || Math.round(plot.areaCent * 435.6)
    return { roadWidth, isCorner, areaSqm, areaSqft }
  }

  const selectedDetails = getSimulatedDetails(selectedPlot)

  const formatPrice = (price) => {
    if (!price || price <= 0) return 'Contact for Price'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  // Builder info references
  const builderName = layout.owner?.name || layout.builderName || layout.phaseInfo?.builderName || layout.phaseInfo?.companyName || 'Prestige Estates'
  const companyName = layout.owner?.companyName || layout.companyName || layout.phaseInfo?.companyName || 'PRESTIGE GROUP'
  const builderPhone = layout.owner?.phone || layout.phaseInfo?.phone || layout.phaseInfo?.contactPhone || '+91 98765 43210'
  const builderWhatsapp = layout.owner?.phone 
    ? layout.owner.phone.replace(/[^0-9]/g, '') 
    : (layout.phaseInfo?.whatsapp || '919876543210')

  const mapEmptyMessage =
    plotsList.length > 0 && filteredPlots.length === 0
      ? 'No plots match your filters. Adjust filters in the sidebar.'
      : 'No plots available.'

  return (
    <div className="premium-plot-buyer-workspace" style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      background: '#f8fafc',
      display: 'flex'
    }}>
      <style>{`
        /* Selected Plot Pulse & Blue Glow Animation */
        @keyframes selectedPulse {
          0% {
            stroke: #2563eb;
            stroke-width: 3.5;
            fill: rgba(37, 99, 235, 0.25);
          }
          50% {
            stroke: #60a5fa;
            stroke-width: 5;
            fill: rgba(37, 99, 235, 0.45);
          }
          100% {
            stroke: #2563eb;
            stroke-width: 3.5;
            fill: rgba(37, 99, 235, 0.25);
          }
        }
        .image-plot-overlay-shape.selected {
          animation: selectedPulse 2s infinite ease-in-out !important;
          stroke: #2563eb !important;
          filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.8)) !important;
        }
        .image-plot-overlay-shape {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .image-plot-overlay-shape:hover {
          fill-opacity: 0.85;
          stroke-width: 2.5;
        }
        /* Glassmorphism Classes */
        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 8px 32px 0 rgba(15, 23, 42, 0.08);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        /* Hide scrollbars but keep functionality */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
      `}</style>

      {/* 1. Full-Screen Interactive Plot Map (Hero) */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <ImagePlotMapView
          imageSrc={imageSrc}
          overlayConfig={layout.overlayConfig || {}}
          plots={filteredPlots}
          selectedPlot={selectedPlot}
          onSelectPlot={setSelectedPlot}
          emptyMessage={mapEmptyMessage}
          zoomPanEnabled
          resetZoomTrigger={resetZoomTrigger}
          zoomInTrigger={zoomInTrigger}
          zoomOutTrigger={zoomOutTrigger}
          storageKey={`public-plot-${layout.id}`}
          onHoverPlot={handleHoverPlot}
        />

        {/* Floating Glassmorphism Map Zoom & View Controls */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10
        }}>
          <button 
            type="button"
            onClick={() => setZoomInTrigger(n => n + 1)}
            className="glass-panel"
            style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(0,0,0,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ➕
          </button>
          <button 
            type="button"
            onClick={() => setZoomOutTrigger(n => n + 1)}
            className="glass-panel"
            style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(0,0,0,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ➖
          </button>
          <button 
            type="button"
            onClick={() => setResetZoomTrigger(n => n + 1)}
            className="glass-panel"
            style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(0,0,0,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🔄
          </button>
        </div>

        {/* Dynamic Legend floating block */}
        <div className="glass-panel" style={{
          position: 'absolute',
          bottom: '24px',
          right: selectedPlot ? '450px' : '24px',
          padding: '10px 16px',
          borderRadius: '12px',
          display: 'flex',
          gap: '16px',
          zIndex: 10,
          transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} /> Available
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b' }} /> Booked
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444' }} /> Sold
          </div>
        </div>
      </div>

      {/* 2. Floating Left Filter / Header Panel */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        width: '360px',
        maxHeight: 'calc(100vh - 48px)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        overflow: 'hidden'
      }}>
        {/* Panel Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LIVE INVENTORY MAP</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{layout.name || 'Premium Layout'}</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            {layout.phaseInfo?.layoutName || 'Interactive Plot Selection'}
          </p>
        </div>

        {/* Dashboard Statistics Header Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '12px 20px', background: 'rgba(241, 245, 249, 0.5)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>TOTAL</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>{stats.available}</div>
            <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>Available</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>{stats.booked}</div>
            <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700 }}>BOOK</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ef4444' }}>{stats.sold}</div>
            <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>SOLD</div>
          </div>
        </div>

        {/* Filter Section Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: '#fff',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
        }} onClick={() => setFilterPanelOpen(!filterPanelOpen)}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>⚡ Filter Search Options</span>
          <span>{filterPanelOpen ? '▼' : '▲'}</span>
        </div>

        {filterPanelOpen && (
          <div className="custom-scrollbar" style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, background: '#fff' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>SEARCH BY PLOT NUMBER</label>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="e.g. 104"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            {/* Facing Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>FACING DIRECTION</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['East', 'West', 'North', 'South'].map(facing => {
                  const active = selectedFacings.includes(facing)
                  return (
                    <button
                      type="button"
                      key={facing}
                      onClick={() => {
                        setSelectedFacings(prev =>
                          active ? prev.filter(f => f !== facing) : [...prev, facing]
                        )
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: active ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                        background: active ? '#ecfdf5' : '#ffffff',
                        color: active ? '#059669' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {facing}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Availability Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>AVAILABILITY STATUS</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Available', 'Booked', 'Sold'].map(status => {
                  const active = selectedAvailabilities.includes(status)
                  return (
                    <button
                      type="button"
                      key={status}
                      onClick={() => {
                        setSelectedAvailabilities(prev =>
                          active ? prev.filter(s => s !== status) : [...prev, status]
                        )
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: active ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                        background: active ? '#ecfdf5' : '#ffffff',
                        color: active ? '#059669' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
            </div>



            {/* Compare Dashboard Widget */}
            {compareList.length > 0 && (
              <div style={{ marginTop: '10px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>PLOT COMPARISON ({compareList.length}/3)</span>
                  <button 
                    type="button"
                    onClick={() => setCompareOpen(true)}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Compare Now
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {compareList.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                      Plot {p.number}
                      <button type="button" onClick={() => toggleCompare(p)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 900 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clear All Button */}
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                background: '#fff',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '10px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Sliding Property Information Drawer */}
      <div className="glass-panel custom-scrollbar" style={{
        position: 'absolute',
        top: '24px',
        right: selectedPlot ? '24px' : '-460px',
        width: '400px',
        height: 'calc(100vh - 48px)',
        borderRadius: '16px',
        zIndex: 30,
        transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        background: '#fff'
      }}>
        {selectedPlot && (
          <>
            {/* Drawer Header */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setSelectedPlot(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: selectedPlot.status === 'Sold' ? '#fef2f2' : selectedPlot.status === 'Booked' ? '#fffbeb' : '#ecfdf5',
                  color: selectedPlot.status === 'Sold' ? '#ef4444' : selectedPlot.status === 'Booked' ? '#d97706' : '#059669',
                }}>
                  {selectedPlot.status || 'Available'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleCompare(selectedPlot)}
                  style={{
                    marginLeft: 'auto',
                    border: '1px solid #cbd5e1',
                    background: compareList.find(p => p.id === selectedPlot.id) ? '#ecfdf5' : '#fff',
                    color: compareList.find(p => p.id === selectedPlot.id) ? '#059669' : '#475569',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    marginRight: '30px'
                  }}
                >
                  {compareList.find(p => p.id === selectedPlot.id) ? '✓ Added to Compare' : '⚖️ Add to Compare'}
                </button>
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Plot {selectedPlot.number}</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                {layout.name} · Phase {layout.phaseInfo?.layoutName || '1'}
              </p>
            </div>

            {/* Price Section */}
            <div style={{ padding: '20px 24px', background: 'rgba(241, 245, 249, 0.4)', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ESTIMATED PRICE</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0a8870', marginTop: '2px' }}>
                {formatPrice(selectedPlot.estimatedPrice)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                Price / Sq Ft: <span style={{ fontWeight: 700, color: '#334155' }}>₹{(selectedPlot.pricePerSqft || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Spec Matrix Grid */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Area (Cent)</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#334155' }}>{selectedPlot.areaCent} Cent</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Area (Sq Ft)</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#334155' }}>{selectedDetails.areaSqft.toLocaleString()} sqft</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Area (Sq M)</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#334155' }}>{selectedDetails.areaSqm} sqm</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Facing Direction</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#334155' }}>{selectedPlot.facing || 'East'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Road Access</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#334155' }}>{selectedDetails.roadWidth}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Corner Lot</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#334155' }}>{selectedDetails.isCorner}</span>
              </div>
            </div>

            {/* Actions Grid */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
              {selectedPlot.status === 'Sold' || selectedPlot.status === 'Booked' ? (
                <div style={{
                  width: '100%',
                  padding: '12px',
                  background: selectedPlot.status === 'Sold' ? '#fef2f2' : '#fffbeb',
                  color: selectedPlot.status === 'Sold' ? '#ef4444' : '#d97706',
                  border: `1px solid ${selectedPlot.status === 'Sold' ? '#fecaca' : '#fde68a'}`,
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  🔒 This plot has already been {selectedPlot.status}.
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType('Booking')
                      setBookingModalOpen(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ⚡ Reserve Plot Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType('Site Visit')
                      setBookingModalOpen(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#ffffff',
                      border: '1.5px solid #10b981',
                      color: '#10b981',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    🗓️ Book Free Site Visit
                  </button>
                </>
              )}

              {/* Messaging & Call Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <a
                  href={`https://wa.me/${builderWhatsapp}?text=Hi, I am interested in Plot ${selectedPlot.number} at ${layout.name}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#25D366',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`tel:${builderPhone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                >
                  📞 Direct Call
                </a>
              </div>
            </div>

            {/* Builder information Card */}
            <div style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
                PROJECT BUILDER INFO
              </h4>
              <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {layout.owner?.logoPath ? (
                    <img
                      src={`${API_BASE}/uploads/${layout.owner.logoPath}`}
                      alt="Builder Logo"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}>
                      🏢
                    </div>
                  )}
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {builderName}
                      <span title="Verified Builder" style={{ fontSize: '0.9rem', cursor: 'help' }}>✅</span>
                    </h5>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{companyName}</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>Experience</span>
                    <span style={{ fontWeight: 700, color: '#475569' }}>
                      {layout.owner?.experience != null ? `${layout.owner.experience} Years` : '15+ Years'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>Projects</span>
                    <span style={{ fontWeight: 700, color: '#475569' }}>
                      {layout.owner?.projectsDelivered != null ? `${layout.owner.projectsDelivered} Delivered` : '28 Delivered'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  RERA: <span style={{ fontWeight: 700, color: '#334155' }}>{layout.owner?.rera || layout.phaseInfo?.rera || 'PRM/KA/RERA/1251/310/PR/003892'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. Hover Tooltip Preview */}
      {hoveredPlot && (
        <div style={{
          position: 'fixed',
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          pointerEvents: 'none',
          zIndex: 1000,
          width: '200px',
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Plot {hoveredPlot.number}</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '10px',
              background: hoveredPlot.status === 'Sold' ? '#ef4444' : hoveredPlot.status === 'Booked' ? '#f59e0b' : '#10b981',
              color: '#fff'
            }}>
              {hoveredPlot.status || 'Available'}
            </span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', margin: '4px 0' }}></div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
            <span>Area:</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>{hoveredPlot.areaCent} Cent</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
            <span>Facing:</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>{hoveredPlot.facing || 'East'}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span>Price:</span>
            <span style={{ fontWeight: 800 }}>{formatPrice(hoveredPlot.estimatedPrice)}</span>
          </div>
        </div>
      )}

      {/* 5. Plot Comparison Modal Overlay */}
      {compareOpen && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '800px',
            borderRadius: '20px',
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>📊 Plot Comparison Dashboard</h3>
              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>SPECIFICATION</th>
                    {compareList.map(p => (
                      <th key={p.id} style={{ padding: '12px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Plot {p.number}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>STATUS</td>
                    {compareList.map(p => (
                      <td key={p.id} style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: p.status === 'Sold' ? '#fef2f2' : p.status === 'Booked' ? '#fffbeb' : '#ecfdf5',
                          color: p.status === 'Sold' ? '#ef4444' : p.status === 'Booked' ? '#d97706' : '#059669',
                        }}>
                          {p.status || 'Available'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>PRICE</td>
                    {compareList.map(p => (
                      <td key={p.id} style={{ padding: '12px', fontWeight: 800, color: '#0a8870' }}>{formatPrice(p.estimatedPrice)}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>AREA (CENT)</td>
                    {compareList.map(p => (
                      <td key={p.id} style={{ padding: '12px', fontWeight: 700, color: '#334155' }}>{p.areaCent} Cent</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>FACING</td>
                    {compareList.map(p => (
                      <td key={p.id} style={{ padding: '12px', fontWeight: 700, color: '#334155' }}>{p.facing || 'East'}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>ROAD WIDTH</td>
                    {compareList.map(p => {
                      const details = getSimulatedDetails(p)
                      return <td key={p.id} style={{ padding: '12px', color: '#475569' }}>{details.roadWidth}</td>
                    })}
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>ACTION</td>
                    {compareList.map(p => (
                      <td key={p.id} style={{ padding: '12px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlot(p)
                            setCompareOpen(false)
                          }}
                          style={{
                            background: '#0a8870',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. Booking / Contact request glassmorphism Modal */}
      {bookingModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '440px',
            borderRadius: '20px',
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {bookingType === 'Booking' ? `Reserve Plot ${selectedPlot?.number}` : `Book Free Site Visit - Plot ${selectedPlot?.number}`}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {bookingType === 'Booking' ? 'Enter your details to block this plot' : 'Enter your details to request a site tour'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>FULL NAME</label>
                <input
                  type="text"
                  required
                  value={bookingForm.name}
                  onChange={e => setBookingForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={bookingForm.email}
                  onChange={e => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rahul@example.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>PHONE NUMBER</label>
                <input
                  type="tel"
                  required
                  value={bookingForm.phone}
                  onChange={e => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>MESSAGE / REQUIREMENTS</label>
                <textarea
                  value={bookingForm.message}
                  onChange={e => setBookingForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="I would like to request callback or schedule site visit."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingBooking}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                {submittingBooking ? 'Submitting request...' : 'Confirm Request'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
