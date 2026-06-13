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
  bedsForConfigurationId,
} from '../utils/buildingSchema'
import { isPlotOnlyLayout } from '../utils/layoutKind'
import toast from 'react-hot-toast'

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
  const [calibratePlotNum, setCalibratePlotNum] = useState('')
  const [editPopupPlot, setEditPopupPlot] = useState(null)
  const [selectedFloorId, setSelectedFloorId] = useState(null)
  const [facadeCalibrateKey, setFacadeCalibrateKey] = useState(null)
  const [error, setError] = useState('')
  const [addConfigCustom, setAddConfigCustom] = useState('')
  const [editFloor, setEditFloor] = useState(null)
  const [floorTab, setFloorTab] = useState('configs') // 'configs' | 'calibrate'
  const [unitGuideMessage, setUnitGuideMessage] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(null) // { configId, kind }
  const [editUnitNamePlot, setEditUnitNamePlot] = useState(null)

  const handleDeleteFacadeFloor = (plot) => {
    setBuilding((b) => ({
      ...b,
      floors: (b.floors || []).filter((f) => f.id !== plot.id),
    }))
    setOverlayConfig((prev) => {
      const norm = normalizeOverlayForBuilding(prev)
      const facadeByFloor = { ...norm.facadeByFloor }
      delete facadeByFloor[plot.id]
      return { ...norm, facadeByFloor }
    })
    if (facadeCalibrateKey === plot.number) {
      const remaining = (building.floors || []).filter((f) => f.id !== plot.id)
      setFacadeCalibrateKey(remaining[0]?.id || null)
    }
  }

  useEffect(() => {
    if (fetchedLayout) {
      if (isPlotOnlyLayout(fetchedLayout)) {
        navigate(`/layout/${id}/edit`, { replace: true })
        return
      }
      const rawPlots = fetchedLayout.plots || []
      const uniquePlots = []
      const seenPlotNums = new Set()
      const seenPlotIds = new Set()
      for (const p of rawPlots) {
        const numKey = `${p.number}-${p.floor}`
        if (!seenPlotNums.has(numKey)) {
          seenPlotNums.add(numKey)
          let finalId = p.id || p.number
          while (seenPlotIds.has(finalId)) {
            finalId = `${finalId}_dup`
          }
          seenPlotIds.add(finalId)
          uniquePlots.push({ ...p, id: finalId })
        }
      }
      setPlots(uniquePlots)
      const bRaw = fetchedLayout.building && fetchedLayout.building.floors ? fetchedLayout.building : { ...defaultBuilding(), ...fetchedLayout.building }
      const floorsMerged = (bRaw.floors || []).map((f) => {
        const configs = f.configurations?.length ? f.configurations : defaultFloorConfigurations()
        const cleanedConfigs = configs.map(c => {
          if (!c.rooms) return c
          const newRooms = { ...c.rooms }
          for (const key in newRooms) {
            if (newRooms[key] && newRooms[key].includes('unsplash.com')) {
              delete newRooms[key]
            }
          }
          return { ...c, rooms: newRooms }
        })
        return {
          ...f,
          configurations: cleanedConfigs,
        }
      })
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
        setSelectedFloorId(prev => prev || sorted[0].id)
        setFacadeCalibrateKey(prev => prev || sorted[0].id)
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
      label: f.label || `Floor ${(f.sortOrder ?? 0) + 1}`,
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

  const uploadApartmentMedia = async (floorId, configId, kind, file, roomId = null) => {
    if (!file) return
    setError('')
    setUploadSuccess('')
    setUploadingMedia({ configId, kind, roomId })
    try {
      // Save current layout state first so that the floor/config exists in the database
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

      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadApartmentMediaMutation({
        id,
        floorId,
        configId,
        kind,
        roomId,
        formData: fd,
      }).unwrap()
      if (res.building) setBuilding(res.building)
      toast.success(`${roomId ? `${roomId.toUpperCase()} ` : ''}${kind === 'image' ? 'Image' : 'Video'} uploaded successfully!`)
    } catch (err) {
      setError(err.data?.error || err.message || 'Upload failed')
    } finally {
      setUploadingMedia(null)
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

  const handleRemoveConfigImage = (floorId, configId, imgPath) => {
    setBuilding((b) => {
      const floors = (b.floors || []).map((f) => {
        if (f.id !== floorId) return f
        const configs = (f.configurations || []).map((c) => {
          if (c.id !== configId) return c
          const images = (c.images || []).filter((img) => img !== imgPath)
          const imagePath = images[0] || null
          return { ...c, images, imagePath }
        })
        return { ...f, configurations: configs }
      })
      return { ...b, floors }
    })
  }

  const handleDeleteRoomMedia = (configId, kind, roomId) => {
    setBuilding((b) => {
      const floors = (b.floors || []).map((f) => {
        if (f.id !== selectedFloorId) return f
        const configs = (f.configurations || []).map((c) => {
          if (c.id !== configId) return c
          if (kind === 'image') {
            const updatedRooms = { ...c.rooms }
            delete updatedRooms[roomId]
            return { ...c, rooms: updatedRooms }
          }
          if (kind === 'video') {
            const updatedVideos = { ...c.roomVideos }
            delete updatedVideos[roomId]
            return { ...c, roomVideos: updatedVideos }
          }
          return c
        })
        return { ...f, configurations: configs }
      })
      return { ...b, floors }
    })
    toast.success('Room media removed.')
  }

  const handleFloorImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedFloorId) return
    setError('')
    setUploadSuccess('')
    setUploadingMedia({ configId: 'floor-plan', kind: 'image' })
    try {
      // Save current layout state first so that the floor exists in the database
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

      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadFloorImage({
        id,
        floorId: selectedFloorId,
        formData: fd,
      }).unwrap()
      const b = res.building || building
      setBuilding(b)
      toast.success('Floor plan image uploaded successfully!')
    } catch (err) {
      setError(err.data?.error || err.message || 'Upload failed')
    } finally {
      setUploadingMedia(null)
    }
    e.target.value = ''
  }

  const handleCalibrateComplete = (plotNum, points) => {
    if (!selectedFloorId) return
    if (!plotNum || String(plotNum).trim() === '') {
      alert("Please enter a unit number first!")
      return
    }
    setOverlayConfig((prev) => {
      const norm = normalizeOverlayForBuilding(prev)
      const byFloor = { ...norm.byFloor }
      byFloor[selectedFloorId] = {
        ...(byFloor[selectedFloorId] || {}),
        [plotNum]: { points },
      }
      return { ...norm, byFloor }
    })
    const exists = plots.find((p) => String(p.number) === String(plotNum) && String(p.floor) === String(selectedFloorId))
    if (!exists) {
      const tower = building.towers?.[0]?.id || 'A'
      setPlots((prev) => [
        ...prev,
        {
          id: String(plotNum),
          number: parseInt(plotNum, 10) || plotNum,
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
    const nextExpected = Number(plotNum) + 1
    setUnitGuideMessage(`Unit ${plotNum} calibrated successfully! You can now adjust its details (facing, price) in the sidebar list below, or click "+ Add Unit" to add Unit ${nextExpected}.`)
  }

  const handleAddUnit = () => {
    const tower = building.towers?.[0]?.id || 'A'
    
    const onThisFloor = plots.filter((p) => String(p.floor) === String(selectedFloorId))
    let maxNum = 0
    for (const p of onThisFloor) {
      const num = parseInt(p.number, 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
    
    const newNum = maxNum > 0 ? maxNum + 1 : 101
    
    let finalId = newNum !== '' ? newNum : `unit_${Math.random().toString(36).substring(2, 6)}`
    setPlots((prev) => {
      while (prev.some(p => String(p.id) === String(finalId))) {
        finalId = `${finalId}_${Math.random().toString(36).substring(2, 6)}`
      }
      return [
        ...prev,
        {
          id: finalId,
          number: newNum,
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
      ]
    })
    
    // We can't alert inside the setter, so we just let it silently ignore if it already exists.
    // The previous alert was mostly helpful, but we can rely on the UI update.
    setCalibratePlotNum(newNum)
    setUnitGuideMessage(`Unit ${newNum} added successfully! Click 4 points on the floor plan map to mark its corners.`)
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
    <div className="builder-workspace">
      <header className="header">
        {/* <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
          ← Dashboard
        </button> */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="header-title" style={{ margin: 0 }}>Apartment / building layout</h2>
          {name && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
              Building Name: <span style={{ color: '#1e293b', fontWeight: 600 }}>{name}</span>
            </div>
          )}
        </div>
        <nav className="header-actions builder-steps" aria-label="Builder steps">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              className={step === i ? 'btn-primary' : 'btn-secondary'}
              style={i > 0 && !building.facadeImagePath ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              onClick={() => {
                if (i > 0 && !building.facadeImagePath) {
                  return
                }
                setStep(i)
              }}
            >
              {i + 1}. {s}
            </button>
          ))}
        </nav>
      </header>
      <main className="builder-main">
        {error && <div className="dashboard-error">{error}</div>}

        {step === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto', background: 'var(--color-bg)' }}>
            <div className="premium-wizard-card" style={{ margin: 0 }}>
              <h3>Upload facade image</h3>
              <p>Upload your building facade image. Once uploaded, you'll calibrate floor bands and add configuration details.</p>
              
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Building Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Tower A"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '0.95rem', 
                    outline: 'none', 
                    background: '#ffffff', 
                    color: 'var(--color-text)' 
                  }} 
                />
              </div>

              {!building.facadeImagePath ? (
                <label className="builder-upload-dashed">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--color-text-muted)' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <input type="file" accept="image/*" onChange={handleFacadeUpload} />
                  Choose facade image
                </label>
              ) : (
                <div>
                  <p style={{ marginTop: '1rem' }}>Facade uploaded. Replace image or continue to calibrate.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setStep(1)} className="btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                      Next: Calibrate
                    </button>
                    <label className="builder-upload-dashed" style={{ padding: '1.5rem' }}>
                      <input type="file" accept="image/*" onChange={handleFacadeUpload} />
                      Replace facade image
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="builder-step builder-step--calibrate" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="builder-calibrate-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: '#1e293b' }}>Calibrate floors</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Add floors and mark each floor band on the facade (4 corners per floor).</p>
              </div>
              <button type="button" onClick={handleAddFloor} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>+</span> Add floor
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
                        onEditPlot={(plot) => {
                          const floor = building.floors.find((f) => f.id === plot.id)
                          if (floor) setEditFloor(floor)
                        }}
                        onDeletePlot={handleDeleteFacadeFloor}
                        calibPoints={calibPoints}
                        title="Facade floors"
                        emptyHint="Select a floor band and click 4 corners on the facade."
                      />
                    )}
                  />
                ) : (
                  <div className="building-no-floor-image" style={{
                    padding: '4rem 2rem',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '16px',
                    color: '#64748b',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    maxWidth: '480px',
                    margin: '6rem auto',
                    gap: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                  }}>
                    <div style={{ fontSize: '3rem' }}>🏢</div>
                    <h4 style={{ margin: '0.5rem 0 0', fontWeight: '700', color: '#1e293b', fontSize: '1.15rem' }}>No Floors Configured</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '340px' }}>
                      Add a floor using the <strong>"+ Add floor"</strong> button above, select it, and mark its 4 corners on the facade image.
                    </p>
                  </div>
                )
              ) : (
                <div className="building-no-floor-image" style={{
                  padding: '4rem 2rem',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  color: '#64748b',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  maxWidth: '480px',
                  margin: '6rem auto',
                  gap: '1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ fontSize: '3rem' }}>📤</div>
                  <h4 style={{ margin: '0.5rem 0 0', fontWeight: '700', color: '#1e293b', fontSize: '1.15rem' }}>Facade Image Required</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '340px' }}>
                    Please go back to the <strong>"1. Upload"</strong> step and choose a building facade image first.
                  </p>
                </div>
              )}
            </div>
            <div style={{ padding: '0.5rem 1.5rem', background: '#fff', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}
                disabled={!building.floors?.length}
              >
                Next: Floor plan
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="builder-step builder-step--floor-plan" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="building-floor-plan-layout" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '1.5rem', padding: '1.5rem', alignItems: 'stretch', background: 'var(--color-bg-wash)', overflow: 'hidden' }}>
              <div className="building-floor-plan-main" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid var(--color-border)' }}>
                {selectedFloorId && currentFloor && (
                  <div className="floor-config-section" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <div className="floor-config-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <select 
                          value={selectedFloorId || ''} 
                          onChange={(e) => setSelectedFloorId(e.target.value)}
                          style={{ width: 'fit-content', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1.4rem', color: 'var(--color-text)', fontWeight: 800, background: '#f8fafc', cursor: 'pointer', outline: 'none' }}
                        >
                          {[...(building.floors || [])]
                            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                            .map((f) => (
                              <option key={f.id} value={f.id} style={{ fontSize: '1rem', fontWeight: 600 }}>
                                {f.label && !/^f\d+$/.test(f.label) ? f.label : `Floor ${(f.sortOrder ?? 0) + 1}`}
                              </option>
                            ))}
                        </select>
                         <p className="floor-config-lede" style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>Upload floor plan image, mark units, and customize BHK/pricing details.</p>
                      </div>
                      <label style={{
                        padding: '0.5rem 1rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        <input type="file" accept="image/*" onChange={handleFloorImage} style={{ display: 'none' }} />
                        📁 {currentFloor.imagePath ? 'Change Image' : 'Upload Image'}
                      </label>
                    </div>

                    {floorImageSrc ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                        {/* Map View */}
                        <div style={{ position: 'relative', flex: 1, minHeight: '500px', background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                          <ImagePlotMapView
                            imageSrc={floorImageSrc}
                            overlayConfig={floorOverlay}
                            plots={unitsOnFloor}
                            selectedPlot={unitsOnFloor.find((p) => String(p.number) === String(calibratePlotNum)) || null}
                            onSelectPlot={(plot) => setCalibratePlotNum(plot.number)}
                            calibrateMode
                            onCalibrateComplete={handleCalibrateComplete}
                            calibratePlotNum={calibratePlotNum}
                            onCalibratePlotNumChange={setCalibratePlotNum}
                            detailsWidth="400px"
                            detailsSlot={({ calibPoints = [] }) => (
                              <div style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                              }}>
                                {/* Calibrate Header */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                  <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                                    Add & Calibrate Units
                                  </h5>
                                  
                                  <button
                                    type="button"
                                    onClick={handleAddUnit}
                                    className="btn-secondary"
                                    style={{ padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, width: '100%', background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                  >
                                    + Add New Unit
                                  </button>

                                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, lineHeight: 1.4, background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {unitGuideMessage || "Click 4 corners on the floor plan map to define the unit's boundary."}
                                  </div>

                                  {calibPoints.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 600 }}>
                                      Calibrating: {calibPoints.length} / 4 points clicked.
                                    </div>
                                  )}
                                </div>

                                {/* Divider */}
                                <div style={{ borderTop: '1px solid #e2e8f0', margin: '0 -1.25rem' }}></div>

                                {/* Marked Units List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Unit Configurations</h4>
                                  {unitsOnFloor.length === 0 ? (
                                    <div style={{ padding: '2rem 1rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>No units marked yet. Add a unit above.</p>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                      {unitsOnFloor.map((unit) => {
                                        const expectedCfgId = unit.configId || `${unit.beds}bhk`
                                        const cfg = currentFloor.configurations?.find(c => c.id === expectedCfgId) || 
                                                    { id: expectedCfgId, label: expectedCfgId.toUpperCase(), rooms: {} }
                                        
                                        return (
                                          <div key={unit.id} id={`unit-card-${unit.id}`} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            {/* Unit Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b' }}>
                                                  {unit.prefix !== undefined ? unit.prefix : 'Unit'} {unit.number}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditUnitNamePlot(unit)}
                                                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                  Edit
                                                </button>
                                                
                                                <select
                                                  value={unit.facing || 'East'}
                                                  onChange={(e) => handleUpdatePlot({ ...unit, facing: e.target.value })}
                                                  style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', padding: 0, marginLeft: '0.5rem' }}
                                                >
                                                  <option value="East">East facing</option>
                                                  <option value="West">West facing</option>
                                                  <option value="North">North facing</option>
                                                  <option value="South">South facing</option>
                                                </select>
                                              </div>
                                              <button
                                                type="button"
                                                className="btn-danger"
                                                onClick={() => handleDeletePlot(unit)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                              >
                                                Delete
                                              </button>
                                            </div>

                                            {/* Inputs grid */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Unit Type</span>
                                                <select
                                                  value={unit.configId || `${unit.beds}bhk`}
                                                  onChange={(e) => {
                                                    const cid = e.target.value
                                                    let b = unit.beds
                                                    if (cid === '1bhk') b = 1
                                                    else if (cid === '2bhk') b = 2
                                                    else if (cid === '3bhk') b = 3
                                                    else if (cid === '4bhk') b = 4
                                                    else if (cid === 'studio') b = 0
                                                    
                                                    setPlots(prev => prev.map(p => p.id === unit.id ? { ...p, configId: cid, beds: b } : p))
                                                  }}
                                                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                                >
                                                  <option value="1bhk">1 BHK</option>
                                                  <option value="2bhk">2 BHK</option>
                                                  <option value="3bhk">3 BHK</option>
                                                  <option value="4bhk">4 BHK</option>
                                                  <option value="studio">Studio</option>
                                                  <option value="custom">Custom</option>
                                                </select>
                                              </label>

                                              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Status</span>
                                                <select
                                                  value={unit.status || 'Available'}
                                                  onChange={(e) => {
                                                    setPlots(prev => prev.map(p => p.id === unit.id ? { ...p, status: e.target.value } : p))
                                                  }}
                                                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                                >
                                                  <option value="Available">Available</option>
                                                  <option value="Booked">Booked</option>
                                                  <option value="Sold">Sold</option>
                                                </select>
                                              </label>

                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Area (sq ft)</span>
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    value={unit.areaSqft || 0}
                                                    onChange={(e) => {
                                                      const val = parseInt(e.target.value, 10) || 0
                                                      setPlots(prev => prev.map(p => p.id === unit.id ? { 
                                                        ...p, 
                                                        areaSqft: val,
                                                        areaCent: parseFloat((val / 435.6).toFixed(2)),
                                                        areaSqm: parseFloat((val / 10.764).toFixed(2)),
                                                        estimatedPrice: val * (p.pricePerSqft || 0)
                                                      } : p))
                                                    }}
                                                    style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                                  />
                                                </label>

                                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Price (₹)</span>
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    value={unit.estimatedPrice || 0}
                                                    onChange={(e) => {
                                                      const val = parseInt(e.target.value, 10) || 0
                                                      setPlots(prev => prev.map(p => p.id === unit.id ? { ...p, estimatedPrice: val } : p))
                                                    }}
                                                    style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                                  />
                                                </label>
                                              </div>
                                            </div>

                                            {/* Room panorama uploads */}
                                            <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.75rem' }}>
                                                Room 360° Images
                                              </span>
                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                {(() => {
                                                  const beds = bedsForConfigurationId(cfg.id) || (cfg.label && parseInt(cfg.label, 10)) || 1
                                                  const roomsList = [
                                                    { id: 'hall', label: 'Living' },
                                                    { id: 'kitchen', label: 'Kitchen' }
                                                  ]
                                                  for (let i = 1; i <= beds; i++) {
                                                    roomsList.push({ id: `bedroom${i}`, label: `Bed ${i}` })
                                                  }
                                                  roomsList.push({ id: 'bathroom', label: 'Bath' })

                                                  return roomsList.map(rm => {
                                                    const isUploading = uploadingMedia?.configId === cfg.id && uploadingMedia?.kind === 'image' && uploadingMedia?.roomId === rm.id
                                                    const rawImageVal = cfg.rooms?.[rm.id]
                                                    const imageVal = rawImageVal && !rawImageVal.includes('unsplash.com') ? rawImageVal : null
                                                    return (
                                                      <div key={rm.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b' }}>{rm.label}</span>
                                                        {imageVal ? (
                                                          <div style={{ position: 'relative', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                                            <img
                                                              src={imageVal.startsWith('http') || imageVal.startsWith('data:') || imageVal.startsWith('blob:') ? imageVal : `${API_BASE}/uploads/${imageVal}`}
                                                              alt={rm.label}
                                                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                            <button
                                                              type="button"
                                                              onClick={() => handleDeleteRoomMedia(cfg.id, 'image', rm.id)}
                                                              style={{
                                                                position: 'absolute',
                                                                top: '4px',
                                                                right: '4px',
                                                                background: 'rgba(239, 68, 68, 0.9)',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '18px',
                                                                height: '18px',
                                                                color: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                fontSize: '10px',
                                                                fontWeight: 'bold'
                                                              }}
                                                            >
                                                              ×
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <label style={{
                                                            height: '60px',
                                                            border: '1.5px dashed #cbd5e1',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            background: '#f8fafc',
                                                            color: '#64748b',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600,
                                                            textAlign: 'center',
                                                          }}>
                                                            <input
                                                              type="file"
                                                              accept="image/*"
                                                              disabled={isUploading}
                                                              onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) uploadApartmentMedia(selectedFloorId, cfg.id, 'image', file, rm.id)
                                                              }}
                                                              style={{ display: 'none' }}
                                                            />
                                                            {isUploading ? '...' : '+ Add'}
                                                          </label>
                                                        )}
                                                      </div>
                                                    )
                                                  })
                                                })()}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '4rem 2rem',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        background: '#fff'
                      }}>
                        <div style={{ fontSize: '3rem' }}>🗺️</div>
                        <h4 style={{ margin: '0.5rem 0 0', fontWeight: '700', color: '#1e293b', fontSize: '1.15rem' }}>No floor plan uploaded for this floor.</h4>
                        <p style={{ margin: '0.5rem 0 1.5rem', color: '#64748b' }}>Please upload a blueprint or top view image to start marking unit polygons.</p>
                        <label className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                          <input type="file" accept="image/*" onChange={handleFloorImage} style={{ display: 'none' }} />
                          📁 Upload Image
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '0.5rem 1.5rem', background: '#fff', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Next: Settings
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', zIndex: 10, background: '#f8fafc', padding: '5.5rem 1.5rem 3rem 1.5rem', color: 'var(--color-text)' }}>
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
              
              {/* Back Button */}
              <button 
                type="button" 
                onClick={() => setStep(2)} 
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
                Back to Floor Plan
              </button>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  Building Settings
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.925rem' }}>Configure public building presentation, walkthroughs, and notifications.</p>
              </div>

              {/* Section 1: Branding & Identity */}
              <div style={{ background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                  Branding & Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Building Name</span>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>URL Slug</span>
                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. emerald-heights-tower" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Subtitle / Phase Name (optional)</span>
                  <input type="text" value={phaseInfo.layoutName} onChange={(e) => setPhaseInfo((p) => ({ ...p, layoutName: e.target.value }))} placeholder="e.g. Tower A, Phase I" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Description (shown on public sidebar)</span>
                  <textarea rows={3} value={phaseInfo.description ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, description: e.target.value }))} placeholder="Spacious 2 & 3 BHK luxury residences." style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', background: '#ffffff', color: 'var(--color-text)' }} />
                </div>
                     {/* Section 2: Contact Options */}
              <div style={{ background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Contact & Support
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Contact Phone</span>
                    <input type="tel" value={phaseInfo.phone ?? phaseInfo.contactPhone ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, phone: e.target.value, contactPhone: e.target.value }))} placeholder="+91 98765 43210" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>WhatsApp Number</span>
                    <input type="tel" value={phaseInfo.whatsapp ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="Include country code (e.g. 919876543210)" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Builder Agent Name</span>
                    <input type="text" value={phaseInfo.builderName ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, builderName: e.target.value }))} placeholder="e.g. Sarah Chen - Senior Consultant" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Company Name</span>
                    <input type="text" value={phaseInfo.companyName ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, companyName: e.target.value }))} placeholder="e.g. LUXURY RESIDENCES CORP" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                  </div>
                </div>
              </div>



              {/* Section 4: Webhook & CRM integration */}
              <div style={{ background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem', marginBottom: '2.5rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                  Webhook & CRM integration
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Webhook URL (fires on user interest submit)</span>
                  <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://api.yourcrm.com/leads/webhook" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff', color: 'var(--color-text)' }} />
                </div>
              </div>              </div>

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
      {editFloor && (
        <div className="plot-interest-modal-root" role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
          <div className="plot-interest-modal-backdrop" onClick={() => setEditFloor(null)} style={{ backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.3)' }} />
          <div className="plot-interest-modal" style={{ maxWidth: '420px', width: '90%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid rgba(226, 232, 240, 0.8)', padding: '2rem' }}>
            <div className="plot-interest-modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
              <h2 className="plot-interest-modal-title" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Edit Floor Name</h2>
              <button type="button" className="plot-interest-modal-close" onClick={() => setEditFloor(null)} style={{ fontSize: '1.75rem', color: 'var(--color-text-muted)', top: '1.5rem', right: '1.5rem' }}>
                ×
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const updatedLabel = e.target.floorLabel.value.trim()
                if (updatedLabel) {
                  setBuilding(b => ({
                    ...b,
                    floors: (b.floors || []).map(f => f.id === editFloor.id ? { ...f, label: updatedLabel } : f)
                  }))
                }
                setEditFloor(null)
              }} 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Floor Name / Label</label>
                <input
                  type="text"
                  name="floorLabel"
                  defaultValue={editFloor.label || editFloor.id}
                  required
                  placeholder="e.g. Ground Floor or Floor 1"
                  style={{ 
                    width: '100%', 
                    padding: '0.85rem 1rem', 
                    borderRadius: '10px', 
                    border: '1px solid var(--color-border)', 
                    fontSize: '1rem',
                    color: 'var(--color-text)',
                    background: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditFloor(null)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text)', fontWeight: '600', cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', flex: 1, boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editUnitNamePlot && (
        <div className="plot-interest-modal-root" role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
          <div className="plot-interest-modal-backdrop" onClick={() => setEditUnitNamePlot(null)} style={{ backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.3)' }} />
          <div className="plot-interest-modal" style={{ maxWidth: '420px', width: '90%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid rgba(226, 232, 240, 0.8)', padding: '2rem' }}>
            <div className="plot-interest-modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
              <h2 className="plot-interest-modal-title" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Edit Unit Name</h2>
              <button type="button" className="plot-interest-modal-close" onClick={() => setEditUnitNamePlot(null)} style={{ fontSize: '1.75rem', color: 'var(--color-text-muted)', top: '1.5rem', right: '1.5rem' }}>
                ×
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const newPrefix = e.target.unitPrefix.value.trim()
                const newNumber = e.target.unitNumber.value.trim()
                handleUpdatePlot({ ...editUnitNamePlot, prefix: newPrefix, number: newNumber })
                setEditUnitNamePlot(null)
              }} 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Prefix</label>
                  <input
                    type="text"
                    name="unitPrefix"
                    defaultValue={editUnitNamePlot.prefix !== undefined ? editUnitNamePlot.prefix : 'Unit'}
                    placeholder="e.g. Unit, Shop"
                    style={{ 
                      width: '100%', 
                      padding: '0.85rem 1rem', 
                      borderRadius: '10px', 
                      border: '1px solid var(--color-border)', 
                      fontSize: '1rem',
                      color: 'var(--color-text)',
                      background: '#fff',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Number / ID</label>
                  <input
                    type="text"
                    name="unitNumber"
                    defaultValue={editUnitNamePlot.number}
                    required
                    placeholder="e.g. 101"
                    style={{ 
                      width: '100%', 
                      padding: '0.85rem 1rem', 
                      borderRadius: '10px', 
                      border: '1px solid var(--color-border)', 
                      fontSize: '1rem',
                      color: 'var(--color-text)',
                      background: '#fff',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditUnitNamePlot(null)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text)', fontWeight: '600', cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', flex: 1, boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
