import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  useGetLayoutByIdQuery,
  useConvertToBuildingMutation,
  useCreateLayoutMutation,
  useUpdateLayoutMutation,
  useUploadLayoutImageMutation,
} from '../api/apiSlice'
import ImagePlotMapView from '../components/ImagePlotMapView'
import CalibratePlotSidebar from '../components/CalibratePlotSidebar'
import PlotEditPopup from '../components/PlotEditPopup'
import { isBuildingLayoutData } from '../utils/layoutKind'
import useSubscriptionDashboard from '../hooks/useSubscriptionDashboard'
import UpgradePrompt from '../components/subscription/UpgradePrompt'

const API_BASE = import.meta.env.VITE_API_URL || ''

const STEPS = ['Upload', 'Calibrate', 'Settings']

export default function LayoutBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { subscription } = useSubscriptionDashboard({ skip: isEdit })

  const { data: fetchedLayout, error: queryError } = useGetLayoutByIdQuery(id, {
    skip: !isEdit,
  })

  const [convertToBuilding, { isLoading: converting }] = useConvertToBuildingMutation()
  const [createLayout] = useCreateLayoutMutation()
  const [updateLayout, { isLoading: saving }] = useUpdateLayoutMutation()
  const [uploadLayoutImage] = useUploadLayoutImageMutation()

  const [layout, setLayout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [plots, setPlots] = useState([])
  const [overlayConfig, setOverlayConfig] = useState({})
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [phaseInfo, setPhaseInfo] = useState({
    layoutName: '',
    badges: [],
    description: '',
    phone: '',
    whatsapp: '',
  })
  const [webhookUrl, setWebhookUrl] = useState('')
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [calibratePlotNum, setCalibratePlotNum] = useState(101)
  const [editPopupPlot, setEditPopupPlot] = useState(null)
  const [error, setError] = useState('')


  const handleSwitchToBuilding = async () => {
    if (!id || !layout) return
    setError('')
    try {
      await convertToBuilding({ id }).unwrap()
      navigate(`/layout/${id}/edit/building`, { replace: true })
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to switch')
    }
  }

  useEffect(() => {
    if (isEdit && fetchedLayout) {
      if (isBuildingLayoutData(fetchedLayout)) {
        navigate(`/layout/${id}/edit/building`, { replace: true })
        return
      }
      setLayout(fetchedLayout)
      setPlots(fetchedLayout.plots || [])
      setOverlayConfig(fetchedLayout.overlayConfig || {})
      setName(fetchedLayout.name || '')
      setSlug(fetchedLayout.slug || '')
      setPhaseInfo({
        layoutName: '',
        badges: [],
        description: '',
        phone: '',
        whatsapp: '',
        ...(fetchedLayout.phaseInfo || {}),
      })
      setWebhookUrl(fetchedLayout.webhookUrl || '')
      if ((fetchedLayout.plots || []).length) setCalibratePlotNum(fetchedLayout.plots[0].number)
      if (fetchedLayout.imagePath) setStep(1)
      setLoading(false)
    } else if (!isEdit) {
      setLoading(false)
    }
  }, [id, isEdit, fetchedLayout, navigate])

  useEffect(() => {
    if (queryError) {
      setError(queryError.data?.error || queryError.error || 'Failed to fetch layout')
      setLoading(false)
    }
  }, [queryError])

  const imageSrc = layout?.imagePath ? `${API_BASE}/uploads/${layout.imagePath}` : null

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      if (isEdit && layout?.id) {
        const fd = new FormData()
        fd.append('image', file)
        await uploadLayoutImage({ id: layout.id, formData: fd }).unwrap()
        setLayout((p) => ({ ...p, imagePath: `${layout.id}/plot.png` }))
        toast.success('Layout map image uploaded successfully!')
      } else {
        const fd = new FormData()
        fd.append('image', file)
        fd.append('name', name || 'Untitled')
        const created = await createLayout(fd).unwrap()
        setLayout(created)
        toast.success(`Plot map "${created.name || 'Untitled'}" created successfully!`)
        navigate(`/layout/${created.id}/edit`, { replace: true })
      }
      setStep(1)
    } catch (err) {
      setError(err.data?.error || err.message || 'Upload failed')
    }
  }

  const handleCalibrateComplete = (plotNum, points) => {
    setOverlayConfig((prev) => ({ ...prev, [plotNum]: { points } }))
    const exists = plots.find((p) => p.number === plotNum)
    if (!exists) {
      setPlots((prev) => [
        ...prev,
        {
          id: plotNum,
          number: plotNum,
          areaCent: 0,
          areaSqft: 0,
          facing: 'East',
          status: 'Available',
          pricePerSqft: 0,
          estimatedPrice: 0,
        },
      ])
      toast.success(`Plot ${plotNum} created successfully!`)
    } else {
      toast.success(`Plot ${plotNum} updated successfully!`)
    }
  }

  const handleAddPlot = () => {
    const nextNum = Math.max(101, ...plots.map((p) => parseInt(p.number, 10)).filter(n => !isNaN(n)), 0) + 1
    setPlots((prev) => [
      ...prev,
      { id: nextNum, number: nextNum, areaCent: 0, areaSqft: 0, facing: 'East', status: 'Available', pricePerSqft: 0, estimatedPrice: 0 },
    ])
    setCalibratePlotNum(nextNum)
    setStep(1)
  }

  const handleUpdatePlot = (updated) => {
    const oldPlot = plots.find((p) => p.id === updated.id || p.number === updated.number)
    const oldNumber = oldPlot?.number
    const newNumber = updated.number

    setPlots((prev) => prev.map((p) => (p.id === updated.id || p.number === oldNumber ? { ...p, ...updated } : p)))

    if (oldNumber != null && newNumber != null && String(oldNumber) !== String(newNumber)) {
      setOverlayConfig((prev) => {
        const next = { ...prev }
        const points = next[oldNumber]?.points
        if (points) {
          next[newNumber] = { points }
          delete next[oldNumber]
        }
        return next
      })
      if (String(calibratePlotNum) === String(oldNumber)) setCalibratePlotNum(newNumber)
    }
  }

  const handleDeletePlot = (plot) => {
    setPlots((prev) => prev.filter((p) => p.id !== plot.id && p.number !== plot.number))
    setOverlayConfig((prev) => {
      const next = { ...prev }
      delete next[plot.number]
      return next
    })
    if (String(calibratePlotNum) === String(plot.number)) {
      const remaining = plots.filter((p) => p.id !== plot.id && p.number !== plot.number)
      setCalibratePlotNum(remaining[0]?.number ?? 101)
    }
  }

  const handleSave = async () => {
    setError('')
    try {
      const payload = {
        id: layout.id,
        name: name || 'Untitled',
        slug: slug || name?.toLowerCase().replace(/\s+/g, '-') || 'layout',
        overlayConfig,
        plots,
        phaseInfo,
        webhookUrl: webhookUrl || null,
      }
      if (isEdit && layout?.id) {
        await updateLayout(payload).unwrap()
        toast.success(`Layout "${name || 'Untitled'}" saved successfully!`)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.data?.error || err.message || 'Save failed')
    }
  }

  if (loading) return <div className="app-loading">Loading...</div>

  if (!isEdit && subscription.layoutLimitReached) {
    return (
      <div className="dashboard-container">
        <UpgradePrompt
          title="Layout limit reached. Upgrade your plan."
          message="Your current plan has reached its layout limit. Upgrade to create more plot maps and building projects."
        />
      </div>
    )
  }

  return (
    <div className="builder-workspace">
      {/* Floating Island Navigation */}
      <nav className="builder-island-nav" aria-label="Builder steps">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={step === i ? 'active' : ''}
            onClick={() => setStep(i)}
          >
            {i + 1}. {s}
          </button>
        ))}
      </nav>



      {error && (
        <div className="toast-inline" style={{ background: 'var(--color-danger)', top: '5rem', bottom: 'auto' }}>
          {error}
        </div>
      )}

      {/* Full Bleed Map Background */}
      {imageSrc ? (
        <div className="builder-workspace-map" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <ImagePlotMapView
            imageSrc={imageSrc}
            overlayConfig={overlayConfig}
            plots={plots}
            selectedPlot={selectedPlot}
            onSelectPlot={setSelectedPlot}
            calibrateMode={step === 1}
            onCalibrateComplete={handleCalibrateComplete}
            calibratePlotNum={calibratePlotNum}
            onCalibratePlotNumChange={setCalibratePlotNum}
            zoomPanEnabled={step !== 1}
            storageKey={`plot-editor-${id}`}
            detailsSlot={
              step === 1
                ? ({ calibPoints = [] }) => (
                    <CalibratePlotSidebar
                      plots={plots}
                      overlayConfig={overlayConfig}
                      calibratePlotNum={calibratePlotNum}
                      onCalibratePlotNumChange={setCalibratePlotNum}
                      onUpdatePlot={handleUpdatePlot}
                      onEditPlot={setEditPopupPlot}
                      onDeletePlot={handleDeletePlot}
                      calibPoints={calibPoints}
                    />
                  )
                : null
            }
          />
        </div>
      ) : (
        <div className="builder-workspace-map" style={{ background: 'var(--color-bg-wash)' }} />
      )}

      {/* Floating Panels for Upload / Settings */}      {step === 0 && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10, background: 'var(--color-bg)' }}>
          <div className="premium-wizard-card">
            <h3>Upload plot map</h3>
            <p>Upload your high-resolution layout map to get started.</p>
            {!imageSrc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Layout name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="builder-input-block"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
                <label className="builder-upload-dashed">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--color-text-muted)' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <input type="file" accept="image/*" onChange={handleFileUpload} />
                  Choose image file
                </label>
              </div>
            ) : (
              <div>
                <p style={{ marginTop: '1rem' }}>Replace the current layout image or proceed to calibration.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                    Continue to Calibrate
                  </button>
                  <label className="builder-upload-dashed" style={{ padding: '1.5rem' }}>
                    <input type="file" accept="image/*" onChange={handleFileUpload} />
                    Replace image
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 1 && imageSrc && (
        <button type="button" className="builder-fab" onClick={handleAddPlot} title="Add new plot">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      )}

      {step === 2 && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', zIndex: 10, background: '#f8fafc', padding: '5.5rem 1.5rem 3rem 1.5rem', color: '#0f172a' }}>
          <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
            
            {/* Back Button */}
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'none', 
                border: 'none', 
                color: '#475569', 
                fontWeight: 700, 
                fontSize: '0.9rem', 
                cursor: 'pointer', 
                marginBottom: '1rem', 
                padding: '0.5rem 0',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Calibration
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Layout Settings
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.925rem' }}>Configure public layout presentation and lead notifications.</p>
            </div>

            {/* Section 1: Branding & Identity */}
            <div style={{ background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                Branding & Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Layout Name</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: '#0f172a' }} />
                </div>
                {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>URL Slug</span>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. green-plot-plan" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: '#0f172a' }} />
                </div> */}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Subtitle / Phase Name (optional)</span>
                <input type="text" value={phaseInfo.layoutName} onChange={(e) => setPhaseInfo((p) => ({ ...p, layoutName: e.target.value }))} placeholder="e.g. Phase I, Premium block" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: '#0f172a' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Description (shown on public sidebar)</span>
                <textarea rows={3} value={phaseInfo.description ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, description: e.target.value }))} placeholder="Phase-I: RERA Approved&#10;PHASE-II: Launching Soon" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', background: '#ffffff', color: '#0f172a' }} />
              </div>
            </div>

            {/* Section 2: Contact Options */}
            <div style={{ background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Contact & Support
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Contact Phone</span>
                  <input type="tel" value={phaseInfo.phone ?? phaseInfo.contactPhone ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, phone: e.target.value, contactPhone: e.target.value }))} placeholder="+91 98765 43210" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: '#0f172a' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>WhatsApp Number</span>
                  <input type="tel" value={phaseInfo.whatsapp ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="Include country code (e.g. 919876543210)" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: '#0f172a' }} />
                </div>
              </div>
            </div>

            {/* Section 3: CRM Integration */}
            <div style={{ background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem', marginBottom: '2.5rem' }}>
              <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                Webhook & CRM integration
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Webhook URL (fires on user interest submit)</span>
                <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://api.yourcrm.com/leads/webhook" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: '#0f172a' }} />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                border: 'none',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 148, 136, 0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.35)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              {saving ? 'Publishing Changes...' : 'Save Layout & Publish'}
            </button>
          </div>
        </div>
      )}

      {editPopupPlot && (
        <PlotEditPopup
          plot={editPopupPlot}
          onSave={(updated) => {
            handleUpdatePlot(updated)
            setEditPopupPlot(null)
          }}
          onClose={() => setEditPopupPlot(null)}
        />
      )}
    </div>
  )
}
