import { useEffect, useRef, useState } from 'react'

export default function PlotViewFAB({
  onOpenFilters,
  onResetView,
  onToggleLegend,
  legendOpen,
  onZoomIn,
  onZoomOut,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="plot-view-fab-root" ref={rootRef}>
      {menuOpen && (
        <div className="plot-view-fab-radial" role="menu" aria-label="Map actions">
          <button
            type="button"
            role="menuitem"
            className="plot-view-fab-mini option-top"
            onClick={() => {
              onZoomIn?.()
              closeMenu()
            }}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            role="menuitem"
            className="plot-view-fab-mini option-right"
            onClick={() => {
              onZoomOut?.()
              closeMenu()
            }}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            role="menuitem"
            className="plot-view-fab-mini option-left"
            onClick={() => {
              closeMenu()
              onOpenFilters()
            }}
            aria-label="Open filters"
          >
            ▽
          </button>
          <button
            type="button"
            role="menuitem"
            className="plot-view-fab-mini option-top-right"
            onClick={() => {
              onToggleLegend?.()
              closeMenu()
            }}
            aria-label={legendOpen ? 'Hide legend' : 'Show legend'}
          >
            i
          </button>
          <button
            type="button"
            role="menuitem"
            className="plot-view-fab-mini option-bottom-right"
            onClick={() => {
              onResetView()
              closeMenu()
            }}
            aria-label="Reset view"
          >
            ↺
          </button>
        </div>
      )}
      <button
        type="button"
        className="plot-view-fab"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={menuOpen ? 'Close map menu' : 'Open map menu'}
      >
        <span className="plot-view-fab-icon" aria-hidden>
          {menuOpen ? '×' : '+'}
        </span>
      </button>
    </div>
  )
}
