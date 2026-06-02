/**
 * 2.5D floor stack: vertical section-style control to pick active floor.
 */
export default function FloorStackPicker({ floors = [], selectedFloorId, onSelectFloor }) {
  const sorted = [...floors].sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0))

  if (!sorted.length) {
    return (
      <div className="floor-stack-picker floor-stack-picker--empty" role="region" aria-label="Floors">
        <p>No floors configured.</p>
      </div>
    )
  }

  return (
    <div className="floor-stack-picker" role="region" aria-label="Select floor">
      <p className="floor-stack-picker-label">Floors</p>
      <div className="floor-stack-picker-rail" aria-orientation="vertical">
        {sorted.map((f) => {
          const active = f.id === selectedFloorId
          return (
            <button
              key={f.id}
              type="button"
              className={`floor-stack-slab ${active ? 'floor-stack-slab--active' : ''}`}
              onClick={() => onSelectFloor?.(f.id)}
              aria-pressed={active}
            >
              <span className="floor-stack-slab-face" aria-hidden />
              <span className="floor-stack-slab-label">{f.label || f.id}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
