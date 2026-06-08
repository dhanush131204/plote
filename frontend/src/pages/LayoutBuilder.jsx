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
    <div className="app">
      <header className="header">
        {/* <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
          ← Dashboard
        </button> */}
        <h2 className="header-title">{isEdit ? 'Edit layout' : 'Create layout'}</h2>
        <nav className="header-actions builder-steps" aria-label="Builder steps">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              className={step === i ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setStep(i)}
            >
              {i + 1}. {s}
            </button>
          ))}
        </nav>
      </header>
      <main className="builder-main">
        {error && <div className="dashboard-error">{error}</div>}
        {isEdit && layout && (
          <div className="builder-switch-banner">
            <p>
              This is a plot layout. Working with a building facade or apartments?
              <button
                type="button"
                className="builder-switch-btn"
                onClick={handleSwitchToBuilding}
                disabled={converting}
              >
                {converting ? 'Switching…' : 'Switch to building editor'}
              </button>
            </p>
          </div>
        )}

        {step === 0 && (
          <div className="builder-step">
            <h3>Upload plot image</h3>
            {!imageSrc ? (
              <div>
                <p>Upload your plot map image to get started.</p>
                <input
                  type="text"
                  placeholder="Layout name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="builder-input builder-input-block"
                />
                <label className="builder-upload">
                  <input type="file" accept="image/*" onChange={handleFileUpload} />
                  Choose image
                </label>
              </div>
            ) : (
              <div>
                <p>Replace the layout image or go back to Calibrate.</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <label className="builder-upload">
                    <input type="file" accept="image/*" onChange={handleFileUpload} />
                    Replace image
                  </label>
                  <button type="button" onClick={() => setStep(1)} className="btn-primary">
                    Back to Calibrate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && imageSrc && (
          <div className="builder-step builder-step--calibrate">
            <div className="builder-calibrate-header">
              <h3>Calibrate plot positions</h3>
              <p>Click 4 corners for each plot. Add a new plot above, then click on the map to calibrate.</p>
              <button type="button" onClick={handleAddPlot} className="btn-primary">
                Add new plot
              </button>
            </div>
            <div className="builder-calibrate-content">
            <ImagePlotMapView
              imageSrc={imageSrc}
              overlayConfig={overlayConfig}
              plots={plots}
              selectedPlot={selectedPlot}
              onSelectPlot={setSelectedPlot}
              calibrateMode
              onCalibrateComplete={handleCalibrateComplete}
              calibratePlotNum={calibratePlotNum}
              onCalibratePlotNumChange={setCalibratePlotNum}
              detailsSlot={({ calibPoints = [] }) => (
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
              )}
            />
            </div>
            <button type="button" onClick={() => setStep(2)} className="btn-primary builder-actions-top">
              Next: Settings
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="builder-step">
            <h3>Settings</h3>
            <label className="builder-field">
              Layout name <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="builder-field">
              URL slug <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. bhuvaneshwari-nagar" />
            </label>
            <label className="builder-field">
              Subtitle / label (optional){' '}
              <input
                type="text"
                value={phaseInfo.layoutName}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, layoutName: e.target.value }))}
                placeholder="e.g. phase name for lead forms"
              />
            </label>
            <label className="builder-field">
              Description (public sidebar){' '}
              <textarea
                className="builder-textarea"
                rows={4}
                value={phaseInfo.description ?? ''}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, description: e.target.value }))}
                placeholder={'Phase-I: 200/2024\nPHASE-II: 201/2024'}
              />
            </label>
            <p className="builder-field-hint">Shown under the layout title on the public map. One line per row.</p>
            <label className="builder-field">
              Contact phone (public map){' '}
              <input
                type="tel"
                value={phaseInfo.phone ?? phaseInfo.contactPhone ?? ''}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, phone: e.target.value, contactPhone: e.target.value }))}
                placeholder="+91 …"
              />
            </label>
            <label className="builder-field">
              WhatsApp number (public map){' '}
              <input
                type="tel"
                value={phaseInfo.whatsapp ?? ''}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, whatsapp: e.target.value }))}
                placeholder="Digits only; defaults to contact phone if empty"
              />
            </label>
            <label className="builder-field">
              Webhook URL (CRM) <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
            </label>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save layout'}
            </button>
          </div>
        )}
      </main>
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
