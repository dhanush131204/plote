import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useGetLayoutByIdQuery,
  useCreateLayoutMutation,
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

const STEPS = ['Building Name', 'Building Image', 'Floor Plans & Units', 'Settings & Publish']

export default function BuildingLayoutBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: fetchedLayout, error: queryError } = useGetLayoutByIdQuery(id, { skip: !id })
  const [createLayout, { isLoading: creating }] = useCreateLayoutMutation()
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

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setStep(0)
      setName('Untitled building')
      setSlug('untitled-building')
      setBuilding(defaultBuilding())
      setOverlayConfig(emptyBuildingOverlay())
      setPlots([])
    }
  }, [id])

  const handleStep1Next = async () => {
    if (!name.trim()) return
    if (!id) {
      try {
        setError('')
        const created = await createLayout({
          name: name.trim(),
          layoutKind: 'building',
          building: defaultBuilding(),
        }).unwrap()
        
        const newId = created?.id
        if (newId != null) {
          navigate(`/layout/${newId}/edit/building`, { replace: true })
          setStep(1)
        } else {
          setError('Server did not return a layout ID.')
        }
      } catch (err) {
        setError(err.data?.error || err.message || 'Failed to create layout')
      }
    } else {
      setStep(1)
    }
  }

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

      if (bRaw.facadeImagePath) {
        setStep(prev => prev === 0 ? 2 : prev)
      } else {
        setStep(prev => prev === 0 ? 1 : prev)
      }
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

  const uploadApartmentMedia = async (floorId, configId, kind, file, roomId = null, plotId = null) => {
    if (!file) return
    setError('')
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
        plotId,
        formData: fd,
      }).unwrap()
      if (res.building) setBuilding(res.building)
      if (res.plots) setPlots(res.plots)
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

  const handleDeleteRoomMedia = (configId, kind, roomId, plotId = null) => {
    if (plotId) {
      setPlots((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(plotId)) return p
          if (kind === 'image') {
            const updatedRooms = { ...p.rooms }
            delete updatedRooms[roomId]
            return { ...p, rooms: updatedRooms }
          }
          return p
        })
      )
    } else {
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
    }
    toast.success('Room media removed.')
  }

  const handleFloorImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedFloorId) return
    setError('')
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
      toast.success(`Unit ${plotNum} created successfully!`)
    } else {
      toast.success(`Unit ${plotNum} updated successfully!`)
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
      if (String(calibratePlotNum) === String(oldNumber)) setCalibratePlotNum(newNumber)
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
    if (String(calibratePlotNum) === String(plot.number)) {
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
      toast.success(`Building "${name || 'Untitled'}" saved successfully!`)
      navigate('/dashboard')
    } catch (err) {
      setError(err.data?.error || err.message || 'Save failed')
    }
  }

  if (loading) return <div className="app-loading">Loading...</div>

  return (
    <div className="builder-workspace">
      <header className="header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="header-title" style={{ margin: 0 }}>Apartment / building layout</h2>
          {name && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
              Building Name: <span style={{ color: '#0d9488', fontWeight: 700 }}>{name}</span>
            </div>
          )}
        </div>
        <nav className="header-actions builder-steps" aria-label="Builder steps" style={{ display: 'flex', gap: '0.5rem' }}>
          {STEPS.map((s, i) => {
            const isClickable = i === 0 || 
              (i === 1 && name.trim()) || 
              (i === 2 && building.facadeImagePath) || 
              (i === 3 && building.floors?.length > 0)
            return (
              <button
                key={s}
                type="button"
                className={step === i ? 'btn-primary' : 'btn-secondary'}
                style={!isClickable ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                onClick={() => {
                  if (isClickable) setStep(i)
                }}
              >
                {i + 1}. {s}
              </button>
            )
          })}
        </nav>
      </header>
      <main className="builder-main">
        {error && <div className="dashboard-error">{error}</div>}

        {step === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--color-bg)' }}>
            <div className="premium-wizard-card" style={{ margin: 0, width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', background: '#fff', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.5rem 0' }}>Step 1: Building Details</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Give your high-rise building project a name and unique web path.</p>
              
              <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Building Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value)
                    setSlug(e.target.value?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                  }} 
                  placeholder="e.g. Prestige Heights"
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

              {id ? (
                <button 
                  type="button" 
                  onClick={handleStep1Next} 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', fontWeight: 700 }}
                  disabled={!name.trim()}
                >
                  Next: Upload Building Image
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <button 
                    type="button" 
                    onClick={() => navigate(-1)} 
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '0.85rem', borderRadius: '8px', fontWeight: 700 }}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleStep1Next} 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '0.85rem', borderRadius: '8px', fontWeight: 700 }}
                    disabled={!name.trim() || creating}
                  >
                    {creating ? 'Creating...' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="builder-step builder-step--calibrate" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
            <div className="builder-calibrate-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: '#1e293b' }}>Step 2: Building Image & Floor Bands</h3>
                <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>Upload your building picture and mark where each floor sits on it.</p>
              </div>
              {building.facadeImagePath && (
                <button type="button" onClick={handleAddFloor} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <strong>+</strong> Add floor
                </button>
              )}
            </div>
            
            <div className="builder-calibrate-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {!building.facadeImagePath ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '2rem' }}>
                  <div className="premium-wizard-card" style={{ maxWidth: '460px', width: '100%', margin: 0, padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="16"></line><line x1="15" y1="22" x2="15" y2="16"></line></svg>
                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--color-text)' }}>Upload facade image</h4>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>Choose a high-quality vertical building render/photo. Buyers will click this to select floors.</p>
                    <label className="builder-upload-dashed" style={{ padding: '2rem' }}>
                      <input type="file" accept="image/*" onChange={handleFacadeUpload} />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.5rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Choose facade image file
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    {building.floors?.length > 0 ? (
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
                        detailsWidth="320px"
                        storageKey={`building-facade-${id}`}
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
                            emptyHint="Add a floor with '+ Add floor', select it, and mark its 4 corners on the building facade image."
                          />
                        )}
                      />
                    ) : (
                      <div style={{ padding: '3rem 1.5rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', color: '#64748b', background: '#fff', maxWidth: '400px', margin: '4rem auto' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 1rem' }}>No floors added yet. Click "+ Add floor" to configure floor bands.</p>
                        <button type="button" onClick={handleAddFloor} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>+ Add floor</button>
                      </div>
                    )}
                  </div>
                  <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <label style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <input type="file" accept="image/*" onChange={handleFacadeUpload} style={{ display: 'none' }} />
                      🔄 Replace facade image
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '0.75rem 1.5rem', background: '#fff', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setStep(0)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600 }}
                disabled={!building.facadeImagePath || !building.floors?.length}
              >
                Next: Floor plan & Units
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="builder-step builder-step--floor-plan" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Select Floor:</span>
                <select 
                  value={selectedFloorId || ''} 
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: 'var(--color-text)', fontWeight: 800, background: '#f8fafc', cursor: 'pointer', outline: 'none' }}
                >
                  {[...(building.floors || [])]
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label && !/^f\d+$/.test(f.label) ? f.label : `Floor ${(f.sortOrder ?? 0) + 1}`}
                      </option>
                    ))}
                </select>
                {selectedFloorId && currentFloor && (
                  <button 
                    type="button" 
                    onClick={() => setEditFloor(currentFloor)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit name
                  </button>
                )}
              </div>
              
              {selectedFloorId && currentFloor && (
                <label style={{
                  padding: '0.4rem 0.85rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <input type="file" accept="image/*" onChange={handleFloorImage} style={{ display: 'none' }} />
                  📁 {currentFloor.imagePath ? 'Change floor plan blueprint' : 'Upload floor plan blueprint'}
                </label>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {selectedFloorId && currentFloor && (
                floorImageSrc ? (
                  <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
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
                      detailsWidth="360px"
                      storageKey={`building-floor-${id}-${selectedFloorId}`}
                      detailsSlot={({ calibPoints = [] }) => (
                        <div style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>
                              Floor Units ({unitsOnFloor.length})
                            </h5>
                            <button
                              type="button"
                              onClick={handleAddUnit}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                              + Add Unit
                            </button>
                          </div>
                          
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, lineHeight: 1.4, background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            {unitGuideMessage || "Click 4 corners on the floor plan blueprint to map the unit's boundary."}
                          </div>

                          {calibPoints.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600 }}>
                              Mapping: {calibPoints.length} / 4 corners marked.
                            </div>
                          )}

                          <div style={{ borderTop: '1px solid #e2e8f0', margin: '0 -1.25rem' }}></div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                            {unitsOnFloor.length === 0 ? (
                              <div style={{ padding: '1.5rem 1rem', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem' }}>No units marked on this floor.</p>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {unitsOnFloor.map((unit) => {
                                  const expectedCfgId = unit.configId || `${unit.beds}bhk`
                                  const cfg = currentFloor.configurations?.find(c => c.id === expectedCfgId) || 
                                              { id: expectedCfgId, label: expectedCfgId.toUpperCase(), rooms: {} }
                                  
                                  return (
                                    <div key={unit.id} id={`unit-card-${unit.id}`} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', background: '#ffffff' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>
                                            {unit.prefix !== undefined ? unit.prefix : 'Unit'} {unit.number}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setEditUnitNamePlot(unit)}
                                            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.1rem 0.35rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                                          >
                                            Edit
                                          </button>
                                          
                                          <select
                                            value={unit.facing || 'East'}
                                            onChange={(e) => handleUpdatePlot({ ...unit, facing: e.target.value })}
                                            style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', padding: 0 }}
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
                                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                        >
                                          Delete
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                          <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Unit Type</span>
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
                                              style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
                                            >
                                              <option value="1bhk">1 BHK</option>
                                              <option value="2bhk">2 BHK</option>
                                              <option value="3bhk">3 BHK</option>
                                              <option value="4bhk">4 BHK</option>
                                              <option value="studio">Studio</option>
                                              <option value="custom">Custom</option>
                                            </select>
                                          </label>

                                          <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Status</span>
                                            <select
                                              value={unit.status || 'Available'}
                                              onChange={(e) => {
                                                setPlots(prev => prev.map(p => p.id === unit.id ? { ...p, status: e.target.value } : p))
                                              }}
                                              style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
                                            >
                                              <option value="Available">Available</option>
                                              <option value="Booked">Booked</option>
                                              <option value="Sold">Sold</option>
                                            </select>
                                          </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                          <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Area (sq ft)</span>
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
                                              style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                          </label>

                                          <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Price (₹)</span>
                                            <input
                                              type="number"
                                              min={0}
                                              value={unit.estimatedPrice || 0}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value, 10) || 0
                                                setPlots(prev => prev.map(p => p.id === unit.id ? { ...p, estimatedPrice: val } : p))
                                              }}
                                              style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                          </label>
                                        </div>
                                      </div>

                                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                                          Room 360° Images
                                        </span>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.35rem' }}>
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
                                            roomsList.push({ id: 'balcony', label: 'Balcony' })

                                            return roomsList.map(rm => {
                                              const isUploading = uploadingMedia?.configId === cfg.id && uploadingMedia?.kind === 'image' && uploadingMedia?.roomId === rm.id
                                              const rawImageVal = unit.rooms?.[rm.id] || cfg.rooms?.[rm.id]
                                              const imageVal = rawImageVal && !rawImageVal.includes('unsplash.com') ? rawImageVal : null
                                              return (
                                                <div key={rm.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                  <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{rm.label}</span>
                                                  {imageVal ? (
                                                    <div style={{ position: 'relative', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                                      <img
                                                        src={imageVal.startsWith('http') || imageVal.startsWith('data:') || imageVal.startsWith('blob:') ? imageVal : `${API_BASE}/uploads/${imageVal}`}
                                                        alt={rm.label}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => handleDeleteRoomMedia(cfg.id, 'image', rm.id, unit.id)}
                                                        style={{
                                                          position: 'absolute',
                                                          top: '2px',
                                                          right: '2px',
                                                          background: 'rgba(239, 68, 68, 0.9)',
                                                          border: 'none',
                                                          borderRadius: '50%',
                                                          width: '14px',
                                                          height: '14px',
                                                          color: '#fff',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          cursor: 'pointer',
                                                          fontSize: '8px',
                                                          fontWeight: 'bold'
                                                        }}
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <label style={{
                                                      height: '40px',
                                                      border: '1px dashed #cbd5e1',
                                                      borderRadius: '4px',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      cursor: 'pointer',
                                                      background: '#f8fafc',
                                                      color: '#64748b',
                                                      fontSize: '0.6rem',
                                                      fontWeight: 600,
                                                    }}>
                                                      <input
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={isUploading}
                                                        onChange={(e) => {
                                                          const file = e.target.files?.[0]
                                                          if (file) uploadApartmentMedia(selectedFloorId, cfg.id, 'image', file, rm.id, unit.id)
                                                        }}
                                                        style={{ display: 'none' }}
                                                      />
                                                      {isUploading ? '...' : '+'}
                                                    </label>
                                                  )}
                                                </div>
                                              )
                                            })
                                          })()}
                                        </div>
                                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                toast.loading('Saving unit...', { id: `save-${unit.id}` })
                                                await updateLayout({ id, name: name || 'Untitled', slug: slug || name?.toLowerCase().replace(/\s+/g, '-') || 'layout', layoutKind: 'building', building, overlayConfig, plots, phaseInfo, webhookUrl: webhookUrl || null }).unwrap()
                                                toast.success('Unit saved successfully!', { id: `save-${unit.id}` })
                                              } catch (err) {
                                                toast.error('Failed to save unit', { id: `save-${unit.id}` })
                                              }
                                            }}
                                            style={{ padding: '0.4rem 0.75rem', background: '#0d9488', color: '#fff', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = '#0f766e'}
                                            onMouseLeave={(e) => e.target.style.background = '#0d9488'}
                                          >
                                            Save Unit Details
                                          </button>
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
                ) : (
                  <div style={{
                    padding: '6rem 2rem',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    textAlign: 'center',
                    background: '#fff',
                    maxWidth: '460px',
                    margin: '4rem auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ fontSize: '3rem' }}>🗺️</div>
                    <h4 style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '1.1rem' }}>No Floor Plan Image</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>Please upload a floor plan blueprint image to calibrate the units on this floor.</p>
                    <label className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.65rem 1.25rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <input type="file" accept="image/*" onChange={handleFloorImage} style={{ display: 'none' }} />
                      📁 Upload Blueprint
                    </label>
                  </div>
                )
              )}
            </div>
            
            <div style={{ padding: '0.75rem 1.5rem', background: '#fff', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600 }}
              >
                Next: Settings & Publish
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="builder-step builder-step--settings" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
            <div className="builder-settings-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                    Step 4: Presentation & Publish Settings
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Configure public presentations, builder agents, and webhooks.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Branding Card */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏷️ Project Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Building Name</span>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>URL Slug</span>
                        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Subtitle / Phase Name (optional)</span>
                      <input type="text" value={phaseInfo.layoutName} onChange={(e) => setPhaseInfo((p) => ({ ...p, layoutName: e.target.value }))} placeholder="e.g. Tower A, Phase I" style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Description (shown on public sidebar)</span>
                      <textarea rows={3} value={phaseInfo.description ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, description: e.target.value }))} placeholder="Spacious 2 & 3 BHK luxury residences." style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>
                  </div>

                  {/* Contact Card */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📞 Contact & Support Options
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Contact Phone</span>
                        <input type="tel" value={phaseInfo.phone ?? phaseInfo.contactPhone ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, phone: e.target.value, contactPhone: e.target.value }))} placeholder="+91 98765 43210" style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>WhatsApp Number</span>
                        <input type="tel" value={phaseInfo.whatsapp ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="Include country code (e.g. 919876543210)" style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Builder Agent Name</span>
                        <input type="text" value={phaseInfo.builderName ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, builderName: e.target.value }))} placeholder="e.g. Sarah Chen - Senior Consultant" style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Company Name</span>
                        <input type="text" value={phaseInfo.companyName ?? ''} onChange={(e) => setPhaseInfo((p) => ({ ...p, companyName: e.target.value }))} placeholder="e.g. LUXURY RESIDENCES CORP" style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                      </div>
                    </div>
                  </div>

                  {/* Webhook Card */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔌 Webhook & CRM Integration
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Webhook URL (fires on user interest submit)</span>
                      <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://api.yourcrm.com/leads/webhook" style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                  </div>

                </div>

              </div>
            </div>

            <div style={{ padding: '0.75rem 1.5rem', background: '#fff', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setStep(2)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}>
                Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                💾 {saving ? 'Publishing...' : 'Save & Publish Building'}
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
