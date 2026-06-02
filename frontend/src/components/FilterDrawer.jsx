import { useEffect, useRef } from 'react'
import Filters from './Filters'

export default function FilterDrawer({ open, onClose, filters, onFilterChange, onReset }) {
  const closeBtnRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    closeBtnRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleReset = () => {
    onReset()
  }

  return (
    <div className="filter-drawer-root" role="presentation">
      <button
        type="button"
        className="filter-drawer-backdrop"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        className="filter-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        <header className="filter-drawer-header">
          <h2 id="filter-drawer-title" className="filter-drawer-title">
            Filters
          </h2>
          <button ref={closeBtnRef} type="button" className="filter-drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="filter-drawer-body">
          <Filters
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={handleReset}
            hideResetButton
            hideTitle
          />
        </div>
        <footer className="filter-drawer-footer">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Reset
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  )
}
