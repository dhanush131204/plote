import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useGetLayoutByIdQuery,
  useUpdateLayoutMutation,
  useUploadFacadeImageMutation,
  useUploadFloorImageMutation,
  useUploadApartmentMediaMutation,
} from '../api/apiSlice'
import ImagePlotMapView from '../components/ImagePlotMapView'
import CalibratePlotSidebar from '../components/CalibratePlotSidebar'
import PlotEditPopup from '../components/PlotEditPopup'
import {
  defaultBuilding,
  defaultFloorConfigurations,
  createConfig,
  CONFIG_PRESETS,
  emptyBuildingOverlay,
  getFacadeOverlayFlat,
  getFloorOverlay,
  normalizeOverlayForBuilding,
} from '../utils/buildingSchema'
import { isPlotOnlyLayout } from '../utils/layoutKind'

const API_BASE = import.meta.env.VITE_API_URL || ''

const STEPS = ['Upload', 'Calibrate', 'Floor plan', 'Settings']

export default function BuildingLayoutBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: fetchedLayout, error: queryError } = useGetLayoutByIdQuery(id)
  const [updateLayout, { isLoading: saving }] = useUpdateLayoutMutation()
  const [uploadFacadeImage] = useUploadFacadeImageMutation()
  const [uploadFloorImage] = useUploadFloorImageMutation()
  const [uploadApartmentMediaMutation] = useUploadApartmentMediaMutation()

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [plots, setPlots] = useState([])
  const [building, setBuilding] = useState(defaultBuilding())
  const [overlayConfig, setOverlayConfig] = useState(emptyBuildingOverlay())
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
  const [selectedFloorId, setSelectedFloorId] = useState(null)
  const [facadeCalibrateKey, setFacadeCalibrateKey] = useState(null)
  const [error, setError] = useState('')
  const [addConfigCustom, setAddConfigCustom] = useState('')

  useEffect(() => {
    if (fetchedLayout) {
      if (isPlotOnlyLayout(fetchedLayout)) {
        navigate(`/layout/${id}/edit`, { replace: true })
        return
      }
      setPlots(fetchedLayout.plots || [])
      const bRaw = fetchedLayout.building && fetchedLayout.building.floors ? fetchedLayout.building : { ...defaultBuilding(), ...fetchedLayout.building }
      const floorsMerged = (bRaw.floors || []).map((f) => ({
        ...f,
        configurations: f.configurations?.length ? f.configurations : defaultFloorConfigurations(),
      }))
      setBuilding({ ...bRaw, floors: floorsMerged })
      setOverlayConfig(normalizeOverlayForBuilding(fetchedLayout.overlayConfig))
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
      const floors = fetchedLayout.building?.floors || []
      if (floors.length) {
        const sorted = [...floors].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        setSelectedFloorId(sorted[0].id)
        setFacadeCalibrateKey(sorted[0].id)
      }
      if ((fetchedLayout.plots || []).length) setCalibratePlotNum(fetchedLayout.plots[0].number)
      setLoading(false)
    }
  }, [id, fetchedLayout, navigate])

  useEffect(() => {
    if (queryError) {
      setError(queryError.data?.error || queryError.error || 'Failed to load building layout')
      setLoading(false)
    }
  }, [queryError])

  useEffect(() => {
    if (!selectedFloorId && building.floors?.length) {
      const sorted = [...building.floors].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      setSelectedFloorId(sorted[0].id)
    }
  }, [building.floors, selectedFloorId])

  useEffect(() => {
    if (!facadeCalibrateKey && building.floors?.length) {
      const sorted = [...building.floors].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      setFacadeCalibrateKey(sorted[0].id)
    }
  }, [building.floors, facadeCalibrateKey])

  const floorOverlay = useMemo(
    () => getFloorOverlay(overlayConfig, selectedFloorId),
    [overlayConfig, selectedFloorId]
  )

  const unitsOnFloor = useMemo(
    () => plots.filter((p) => String(p.floor) === String(selectedFloorId)),
    [plots, selectedFloorId]
  )

  const currentFloor = useMemo(
    () => building.floors?.find((f) => f.id === selectedFloorId),
    [building.floors, selectedFloorId]
  )

  const floorImageSrc = currentFloor?.imagePath ? `${API_BASE}/uploads/${currentFloor.imagePath}` : null

  const facadeImageSrc = building.facadeImagePath ? `${API_BASE}/uploads/${building.facadeImagePath}` : null

  const facadePlots = useMemo(() => {
    const sorted = [...(building.floors || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    return sorted.map((f) => ({
      id: f.id,
      number: f.id,
      floor: f.id,
      tower: building.towers?.[0]?.id || 'A',
      beds: 2,
      areaCent: 0,
      areaSqft: 0,
      facing: 'East',
      status: 'Available',
      pricePerSqft: 0,
      estimatedPrice: 0,
    }))
  }, [building.floors, building.towers])

  const facadeOverlayFlat = useMemo(() => getFacadeOverlayFlat(overlayConfig), [overlayConfig])

  const handleAddFloor = () => {
    const fid = `f${Date.now()}`
    const nextFloors = [
      ...(building.floors || []),
      {
        id: fid,
        label: `Floor ${(building.floors?.length || 0) + 1}`,
        sortOrder: building.floors?.length || 0,
        imagePath: null,
        configurations: defaultFloorConfigurations(),
      },
    ]
    const next = { ...building, floors: nextFloors }
    setBuilding(next)
    setSelectedFloorId(fid)
    setFacadeCalibrateKey(fid)
  }

  const handleFacadeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadFacadeImage({ id, formData: fd }).unwrap()
      if (res.building) setBuilding(res.building)
      setStep(1)
    } catch (err) {
      setError(err.data?.error || err.message || 'Upload failed')
    }
    e.target.value = ''
  }

  const handleFacadeCalibrateComplete = (floorKey, points) => {
    setOverlayConfig((prev) => {
      const norm = normalizeOverlayForBuilding(prev)
      return {
        ...norm,
        facadeByFloor: {
          ...norm.facadeByFloor,
          [floorKey]: { points },
        },
      }
    })
  }

  const uploadApartmentMedia = async (floorId, configId, kind, file) => {
    if (!file) return
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadApartmentMediaMutation({
        id,
        floorId,
        configId,
        kind,
        formData: fd,
      }).unwrap()
      if (res.building) setBuilding(res.building)
    } catch (err) {
      setError(err.data?.error || err.message || 'Upload failed')
    }
  }

  const handleUpdateConfig = (floorId, configId, updates) => {
    setBuilding((b) => {
      const floors = (b.floors || []).map((f) => {
        if (f.id !== floorId) return f
        const configs = (f.configurations || []).map((c) =>
          c.id === configId ? { ...c, ...updates } : c
        )
        return { ...f, configurations: configs }
      })
      return { ...b, floors }
    })
  }

  const handleAddConfig = (floorId, presetOrLabel) => {
    const newConfig = createConfig(presetOrLabel)
    setBuilding((b) => {
      const floors = (b.floors || []).map((f) => {
        if (f.id !== floorId) return f
        const existing = f.configurations || []
        if (existing.some((c) => c.id === newConfig.id)) {
          const unique = { ...newConfig, id: `${newConfig.id}-${Date.now()}` }
          return { ...f, configurations: [...existing, unique] }
        }
        return { ...f, configurations: [...existing, newConfig] }
      })
      return { ...b, floors }
    })
  }

  const handleRemoveConfig = (floorId, configId) => {
    setBuilding((b) => ({
      ...b,
      floors: (b.floors || []).map((f) =>
        f.id === floorId
          ? { ...f, configurations: (f.configurations || []).filter((c) => c.id !== configId) }
          : f
      ),
    }))
  }

  const handleFloorImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedFloorId) return
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadFloorImage({
        id,
        floorId: selectedFloorId,
        formData: fd,
      }).unwrap()
      const b = res.building || building
      setBuilding(b)
    } catch (err) {
      setError(err.data?.error || err.message || 'Upload failed')
    }
    e.target.value = ''
  }

  const handleCalibrateComplete = (plotNum, points) => {
    if (!selectedFloorId) return
    setOverlayConfig((prev) => {
      const norm = normalizeOverlayForBuilding(prev)
      const byFloor = { ...norm.byFloor }
      byFloor[selectedFloorId] = {
        ...(byFloor[selectedFloorId] || {}),
        [plotNum]: { points },
      }
      return { ...norm, byFloor }
    })
    const exists = plots.find((p) => p.number === plotNum && String(p.floor) === String(selectedFloorId))
    if (!exists) {
      const tower = building.towers?.[0]?.id || 'A'
      setPlots((prev) => [
        ...prev,
        {
          id: plotNum,
          number: plotNum,
          floor: selectedFloorId,
          tower,
          beds: 2,
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

  const handleAddUnit = () => {
    const onThisFloor = plots.filter((p) => String(p.floor) === String(selectedFloorId))
    const nextNum = Math.max(101, ...onThisFloor.map((p) => p.number), ...plots.map((p) => p.number), 0) + 1
    const tower = building.towers?.[0]?.id || 'A'
    setPlots((prev) => [
      ...prev,
      {
        id: nextNum,
        number: nextNum,
        floor: selectedFloorId,
        tower,
        beds: 2,
        areaCent: 0,
        areaSqft: 0,
        facing: 'East',
        status: 'Available',
        pricePerSqft: 0,
        estimatedPrice: 0,
      },
    ])
    setCalibratePlotNum(nextNum)
  }

  const handleUpdatePlot = (updated) => {
    const oldPlot = plots.find((p) => p.id === updated.id || p.number === updated.number)
    const oldNumber = oldPlot?.number
    const newNumber = updated.number
    const oldFloor = oldPlot?.floor

    setPlots((prev) => prev.map((p) => (p.id === updated.id || p.number === oldNumber ? { ...p, ...updated } : p)))

    if (oldNumber != null && newNumber != null && String(oldNumber) !== String(newNumber)) {
      setOverlayConfig((prev) => {
        const norm = normalizeOverlayForBuilding(prev)
        const fid = oldFloor || selectedFloorId
        const layer = { ...(norm.byFloor?.[fid] || {}) }
        const pts = layer[oldNumber]?.points
        if (pts) {
          layer[newNumber] = { points: pts }
          delete layer[oldNumber]
        }
        return { ...norm, byFloor: { ...norm.byFloor, [fid]: layer } }
      })
      if (calibratePlotNum === oldNumber) setCalibratePlotNum(newNumber)
    }
  }

  const handleDeletePlot = (plot) => {
    setPlots((prev) => prev.filter((p) => p.id !== plot.id && p.number !== plot.number))
    setOverlayConfig((prev) => {
      const norm = normalizeOverlayForBuilding(prev)
      const fid = plot.floor || selectedFloorId
      const layer = { ...(norm.byFloor?.[fid] || {}) }
      delete layer[plot.number]
      return { ...norm, byFloor: { ...norm.byFloor, [fid]: layer } }
    })
    if (calibratePlotNum === plot.number) {
      const remaining = plots.filter((p) => p.id !== plot.id && p.number !== plot.number)
      setCalibratePlotNum(remaining[0]?.number ?? 101)
    }
  }

  const handleSave = async () => {
    setError('')
    try {
      await updateLayout({
        id,
        name: name || 'Untitled',
        slug: slug || name?.toLowerCase().replace(/\s+/g, '-') || 'layout',
        layoutKind: 'building',
        building,
        overlayConfig,
        plots,
        phaseInfo,
        webhookUrl: webhookUrl || null,
      }).unwrap()
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
        <h2 className="header-title">Apartment / building layout</h2>
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

        {step === 0 && (
          <div className="builder-step">
            <h3>Upload facade image</h3>
            <p className="building-builder-lede">
              Upload your building facade image. Once uploaded, you&apos;ll calibrate floor bands and add configuration details.
            </p>
            <label className="builder-upload builder-upload-large">
              <input type="file" accept="image/*" onChange={handleFacadeUpload} />
              Choose facade image
            </label>
            {building.facadeImagePath && (
              <p className="builder-field-hint">
                Facade uploaded. Click &quot;Next: Calibrate&quot; or continue below.
              </p>
            )}
            {facadeImageSrc && (
              <button type="button" onClick={() => setStep(1)} className="btn-primary builder-actions-top">
                Next: Calibrate
              </button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="builder-step builder-step--calibrate">
            <div className="builder-calibrate-header">
              <h3>Calibrate floors</h3>
              <p>Add floors and mark each floor band on the facade (4 corners per floor).</p>
              <button type="button" onClick={handleAddFloor} className="btn-primary">
                Add floor
              </button>
            </div>
            <div className="builder-calibrate-content">
              {facadeImageSrc ? (
                building.floors?.length > 0 ? (
                  <ImagePlotMapView
                    imageSrc={facadeImageSrc}
                    overlayConfig={facadeOverlayFlat}
                    plots={facadePlots}
                    selectedPlot={facadePlots.find((p) => p.id === facadeCalibrateKey) || null}
                    onSelectPlot={() => {}}
                    calibrateMode
                    onCalibrateComplete={handleFacadeCalibrateComplete}
                    calibratePlotNum={facadeCalibrateKey}
                    onCalibratePlotNumChange={setFacadeCalibrateKey}
                    detailsSlot={({ calibPoints = [] }) => (
                      <CalibratePlotSidebar
                        plots={facadePlots}
                        overlayConfig={facadeOverlayFlat}
                        calibratePlotNum={facadeCalibrateKey}
                        onCalibratePlotNumChange={setFacadeCalibrateKey}
                        onUpdatePlot={() => {}}
                        onEditPlot={() => {}}
                        onDeletePlot={() => {}}
                        calibPoints={calibPoints}
                        title="Facade floors"
                        emptyHint="Select a floor band and click 4 corners on the facade."
                      />
                    )}
                  />
                ) : (
                  <div className="building-no-floor-image">
                    <p>Add at least one floor using the button above, then select it and click 4 corners on the facade.</p>
                  </div>
                )
              ) : (
                <div className="building-no-floor-image">
                  <p>Upload a facade image in the Upload step first.</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary builder-actions-top"
              disabled={!building.floors?.length}
            >
              Next: Floor plan
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="builder-step builder-step--floor-plan">
            <div className="building-floor-plan-layout">
              <aside className="building-floor-plan-sidebar">
                <h4 className="builder-subheading">Floors</h4>
                <ul className="building-floor-list-ul">
                  {[...(building.floors || [])]
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          className={`building-floor-list-btn ${selectedFloorId === f.id ? 'active' : ''}`}
                          onClick={() => setSelectedFloorId(f.id)}
                        >
                          {f.label || f.id}
                        </button>
                      </li>
                    ))}
                </ul>
              </aside>
              <div className="building-floor-plan-main">
                {selectedFloorId && currentFloor && (
                  <div className="floor-config-section">
                    <div className="floor-config-header">
                      <h4 className="floor-config-title">{currentFloor.label || currentFloor.id}</h4>
                      <p className="floor-config-lede">Add configurations (2 BHK, 3 BHK, etc.) and enter details. No calibration required.</p>
                    </div>

                    <div className="floor-config-plan-upload">
                      <label className="floor-config-add-label">Floor plan image (optional)</label>
                      <label className="builder-upload">
                        <input type="file" accept="image/*" onChange={handleFloorImage} />
                        {currentFloor.imagePath ? 'Replace floor plan' : 'Upload floor plan'}
                      </label>
                    </div>

                    <div className="floor-config-add-row">
                      <label className="floor-config-add-label">Add configuration</label>
                      <div className="floor-config-add-controls">
                        <select
                          className="floor-config-add-select"
                          value=""
                          onChange={(e) => {
                            const v = e.target.value
                            if (v) {
                              handleAddConfig(selectedFloorId, CONFIG_PRESETS.find((p) => p.id === v) || v)
                              e.target.value = ''
                            }
                          }}
                        >
                          <option value="">Choose type…</option>
                          {CONFIG_PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                        <div className="floor-config-add-custom">
                          <input
                            type="text"
                            className="floor-config-add-input"
                            placeholder="Or type custom (e.g. Penthouse)"
                            value={addConfigCustom}
                            onChange={(e) => setAddConfigCustom(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (addConfigCustom.trim()) {
                                  handleAddConfig(selectedFloorId, addConfigCustom.trim())
                                  setAddConfigCustom('')
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-secondary floor-config-add-btn"
                            onClick={() => {
                              if (addConfigCustom.trim()) {
                                handleAddConfig(selectedFloorId, addConfigCustom.trim())
                                setAddConfigCustom('')
                              }
                            }}
                            disabled={!addConfigCustom.trim()}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {(currentFloor.configurations || []).length === 0 ? (
                      <div className="floor-config-empty">
                        <p>No configurations yet. Add one above.</p>
                      </div>
                    ) : (
                      <ul className="floor-config-list">
                        {(currentFloor.configurations || []).map((cfg) => (
                          <li key={cfg.id} className="floor-config-card">
                            <div className="floor-config-card-header">
                              <h5 className="floor-config-card-title">{cfg.label || cfg.id}</h5>
                              <button
                                type="button"
                                className="floor-config-remove"
                                onClick={() => handleRemoveConfig(selectedFloorId, cfg.id)}
                                aria-label={`Remove ${cfg.label || cfg.id}`}
                              >
                                ×
                              </button>
                            </div>
                            <div className="floor-config-fields">
                              <label className="floor-config-field">
                                <span>Area (sq ft)</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={cfg.areaSqft ?? 0}
                                  onChange={(e) =>
                                    handleUpdateConfig(selectedFloorId, cfg.id, {
                                      areaSqft: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                />
                              </label>
                              <label className="floor-config-field">
                                <span>Area (sq m)</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={cfg.areaSqm ?? 0}
                                  onChange={(e) =>
                                    handleUpdateConfig(selectedFloorId, cfg.id, {
                                      areaSqm: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                />
                              </label>
                              <label className="floor-config-field">
                                <span>Price per sq ft (₹)</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={cfg.pricePerSqft ?? 0}
                                  onChange={(e) =>
                                    handleUpdateConfig(selectedFloorId, cfg.id, {
                                      pricePerSqft: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                />
                              </label>
                            </div>
                            <div className="floor-config-media">
                              <label className="builder-upload floor-config-upload">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file && selectedFloorId) uploadApartmentMedia(selectedFloorId, cfg.id, 'image', file)
                                    e.target.value = ''
                                  }}
                                />
                                {cfg.imagePath ? 'Replace image' : 'Add image'}
                              </label>
                              <label className="builder-upload floor-config-upload">
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file && selectedFloorId) uploadApartmentMedia(selectedFloorId, cfg.id, 'video', file)
                                    e.target.value = ''
                                  }}
                                />
                                {cfg.videoPath ? 'Replace video' : 'Add video'}
                              </label>
                            </div>
                            {(cfg.imagePath || cfg.videoPath) && (
                              <p className="floor-config-media-hint">
                                {cfg.imagePath && <span>Image</span>}
                                {cfg.imagePath && cfg.videoPath && ' · '}
                                {cfg.videoPath && <span>Video</span>}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button type="button" onClick={() => setStep(3)} className="btn-primary builder-actions-top">
              Next: Settings
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="builder-step">
            <h3>Settings</h3>
            <label className="builder-field">
              Layout name <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="builder-field">
              URL slug <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. tower-a-phase-1" />
            </label>
            <label className="builder-field">
              Subtitle / label (optional){' '}
              <input
                type="text"
                value={phaseInfo.layoutName}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, layoutName: e.target.value }))}
              />
            </label>
            <label className="builder-field">
              Description (public sidebar){' '}
              <textarea
                className="builder-textarea"
                rows={4}
                value={phaseInfo.description ?? ''}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, description: e.target.value }))}
              />
            </label>
            <label className="builder-field">
              Contact phone (public){' '}
              <input
                type="tel"
                value={phaseInfo.phone ?? ''}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, phone: e.target.value }))}
              />
            </label>
            <label className="builder-field">
              WhatsApp (public){' '}
              <input
                type="tel"
                value={phaseInfo.whatsapp ?? ''}
                onChange={(e) => setPhaseInfo((p) => ({ ...p, whatsapp: e.target.value }))}
              />
            </label>
            <label className="builder-field">
              Optional embed URL (Matterport, Sketchfab, etc.){' '}
              <input
                type="url"
                value={building.embed3dUrl ?? ''}
                onChange={(e) => setBuilding((b) => ({ ...b, embed3dUrl: e.target.value || null }))}
                placeholder="https://…"
              />
            </label>
            <p className="builder-field-hint">Shown on the public page above the 3D stack preview when set.</p>
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
          buildingMode
          floors={building.floors || []}
          towers={building.towers || []}
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
