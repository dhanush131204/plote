/** Default JSON for `layouts.building` when layoutKind is `building`. */
export function defaultBuilding() {
  return {
    floors: [],
    towers: [{ id: 'A', label: 'Tower A' }],
    embed3dUrl: null,
    facadeImagePath: null,
  }
}

/** Default 2BHK / 3BHK rows for a floor (legacy; new floors start empty). */
export function defaultFloorConfigurations() {
  return []
}

/** Preset configuration options for "Add configuration" picker. */
export const CONFIG_PRESETS = [
  { id: '1bhk', label: '1 BHK' },
  { id: '2bhk', label: '2 BHK' },
  { id: '3bhk', label: '3 BHK' },
  { id: '4bhk', label: '4 BHK' },
  { id: 'studio', label: 'Studio' },
]

/** Create a new config from preset or custom label. */
export function createConfig(presetOrLabel) {
  if (typeof presetOrLabel === 'object' && presetOrLabel?.id) {
    return {
      id: presetOrLabel.id,
      label: presetOrLabel.label,
      imagePath: null,
      videoPath: null,
      areaSqft: 0,
      areaSqm: 0,
      pricePerSqft: 0,
      description: null,
    }
  }
  const label = String(presetOrLabel || 'Config').trim() || 'Config'
  const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'cfg'
  return {
    id: id || `cfg-${Date.now()}`,
    label,
    imagePath: null,
    videoPath: null,
    areaSqft: 0,
    areaSqm: 0,
    pricePerSqft: 0,
    description: null,
  }
}

/** Map configuration id to bedroom count for filtering inventory. */
export function bedsForConfigurationId(configId) {
  const id = String(configId || '').toLowerCase()
  if (id === '1bhk' || id === '1') return 1
  if (id === '2bhk' || id === '2') return 2
  if (id === '3bhk' || id === '3') return 3
  if (id === '4bhk' || id === '4') return 4
  return null
}

/** Overlay shape: unit polygons by floor, plus facade bands by floor id. */
export function emptyBuildingOverlay() {
  return { byFloor: {}, facadeByFloor: {} }
}

/** Normalize overlay from API (legacy shapes → full building overlay). */
export function normalizeOverlayForBuilding(overlayConfig) {
  if (!overlayConfig || typeof overlayConfig !== 'object') return emptyBuildingOverlay()
  const byFloor = overlayConfig.byFloor && typeof overlayConfig.byFloor === 'object' ? overlayConfig.byFloor : {}
  const facadeByFloor =
    overlayConfig.facadeByFloor && typeof overlayConfig.facadeByFloor === 'object'
      ? overlayConfig.facadeByFloor
      : {}
  return { ...overlayConfig, byFloor, facadeByFloor }
}

export function getFloorOverlay(overlayConfig, floorId) {
  const o = normalizeOverlayForBuilding(overlayConfig)
  return o.byFloor?.[floorId] || {}
}

/** Flat map keyed by floor id for facade ImagePlotMapView (same shape as unit overlay per key). */
export function getFacadeOverlayFlat(overlayConfig) {
  const o = normalizeOverlayForBuilding(overlayConfig)
  const raw = o.facadeByFloor || {}
  const out = {}
  Object.entries(raw).forEach(([fid, cfg]) => {
    if (cfg?.points?.length) out[fid] = { points: cfg.points }
  })
  return out
}
