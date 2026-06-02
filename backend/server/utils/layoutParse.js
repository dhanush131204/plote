function safeJsonObject(raw, fallback = {}) {
  if (raw == null || raw === '') return fallback
  try {
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) return raw
    const s = typeof raw === 'string' ? raw.trim() : String(raw)
    if (s === '' || s === 'null') return fallback
    const v = JSON.parse(s)
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

function safeJsonArray(raw, fallback = []) {
  if (raw == null || raw === '') return fallback
  try {
    if (Array.isArray(raw)) return raw
    const s = typeof raw === 'string' ? raw.trim() : String(raw)
    if (s === '' || s === 'null') return fallback
    const v = JSON.parse(s)
    return Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

/** Building column → object or null (never throws). */
function parseBuildingColumn(raw) {
  if (raw == null || raw === '') return null
  try {
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) return raw
    const s = typeof raw === 'string' ? raw.trim() : String(raw)
    if (s === '' || s === 'null') return null
    const v = JSON.parse(s)
    if (v == null) return null
    if (typeof v !== 'object' || Array.isArray(v)) return null
    return v
  } catch {
    return null
  }
}

function parseLayout(layout) {
  const buildingObj = parseBuildingColumn(layout.building)
  let layoutKind = layout.layoutKind || 'plot'
  if (layoutKind === 'plot' && buildingObj != null) {
    layoutKind = 'building'
  }
  let overlayConfig = safeJsonObject(layout.overlayConfig, {})
  if (layoutKind === 'building') {
    if (!overlayConfig.byFloor || typeof overlayConfig.byFloor !== 'object') {
      overlayConfig = { ...overlayConfig, byFloor: {} }
    }
    if (!overlayConfig.facadeByFloor || typeof overlayConfig.facadeByFloor !== 'object') {
      overlayConfig = { ...overlayConfig, facadeByFloor: {} }
    }
  }
  return {
    ...layout,
    layoutKind,
    overlayConfig,
    plots: safeJsonArray(layout.plots, []),
    phaseInfo: safeJsonObject(layout.phaseInfo, {}),
    building: buildingObj,
  }
}

module.exports = { parseLayout }
