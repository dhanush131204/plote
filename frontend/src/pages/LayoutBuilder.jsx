import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const API_BASE = import.meta.env.VITE_API_URL || ''

const STEPS = ['Upload', 'Calibrate', 'Settings']

export default function LayoutBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

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
      } else {
        const fd = new FormData()
        fd.append('image', file)
        fd.append('name', name || 'Untitled')
        const created = await createLayout(fd).unwrap()
        setLayout(created)
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
    }
  }

  const handleAddPlot = () => {
    const nextNum = Math.max(101, ...plots.map((p) => p.number), 0) + 1
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
      if (calibratePlotNum === oldNumber) setCalibratePlotNum(newNumber)
    }
  }

  const handleDeletePlot = (plot) => {
    setPlots((prev) => prev.filter((p) => p.id !== plot.id && p.number !== plot.number))
    setOverlayConfig((prev) => {
      const next = { ...prev }
      delete next[plot.number]
      return next
    })
    if (calibratePlotNum === plot.number) {
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
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.data?.error || err.message || 'Save failed')
    }
  }

  if (loading) return <div className="app-loading">Loading...</div>

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
        <div className="builder-workspace-map">
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
        <div className="builder-floating-panel">
          <h3>Settings</h3>
          <p>Configure public layout details.</p>
          <label className="builder-field">
            Layout name <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="builder-field">
            URL slug <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. bhuvaneshwari-nagar" />
          </label>
          <label className="builder-field">
            Subtitle / label (optional)
            <input
              type="text"
              value={phaseInfo.layoutName}
              onChange={(e) => setPhaseInfo((p) => ({ ...p, layoutName: e.target.value }))}
              placeholder="e.g. phase name for lead forms"
            />
          </label>
          <label className="builder-field">
            Description (public sidebar)
            <textarea
              className="builder-textarea"
              rows={3}
              value={phaseInfo.description ?? ''}
              onChange={(e) => setPhaseInfo((p) => ({ ...p, description: e.target.value }))}
              placeholder={'Phase-I: 200/2024\nPHASE-II: 201/2024'}
            />
          </label>
          <label className="builder-field">
            Contact phone (public map)
            <input
              type="tel"
              value={phaseInfo.phone ?? phaseInfo.contactPhone ?? ''}
              onChange={(e) => setPhaseInfo((p) => ({ ...p, phone: e.target.value, contactPhone: e.target.value }))}
              placeholder="+91 …"
            />
          </label>
          <label className="builder-field">
            WhatsApp number
            <input
              type="tel"
              value={phaseInfo.whatsapp ?? ''}
              onChange={(e) => setPhaseInfo((p) => ({ ...p, whatsapp: e.target.value }))}
              placeholder="Digits only; defaults to contact phone"
            />
          </label>
          <label className="builder-field">
            Webhook URL (CRM) <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
          </label>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
            {saving ? 'Saving...' : 'Save layout & publish'}
          </button>
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
