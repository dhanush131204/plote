/** True if this layout should use the building (facade / apartment) editor. */
export function isBuildingLayoutData(data) {
  if (!data) return false
  const kind = data.layoutKind || 'plot'
  if (kind === 'building') return true
  const b = data.building
  return b != null && typeof b === 'object' && !Array.isArray(b)
}

/** Plot site-plan layout with no building JSON — must use LayoutBuilder, not BuildingLayoutBuilder. */
export function isPlotOnlyLayout(data) {
  if (!data) return false
  const kind = data.layoutKind || 'plot'
  const hasBuilding =
    data.building != null && typeof data.building === 'object' && !Array.isArray(data.building)
  return kind === 'plot' && !hasBuilding
}
