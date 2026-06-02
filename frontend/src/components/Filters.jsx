const AREA_OPTIONS = ['Below 2', '2-3', '3-5', '5-10', 'Above 10']

const PRICE_OPTIONS = ['Below 3L', '3L-5L', '5L-10L', '10L-25L', 'Above 25L']

export default function Filters({ filters, onFilterChange, onReset, hideResetButton = false, hideTitle = false }) {
  const availabilityOpts = ['All', 'Available', 'Booked', 'Sold']
  const facingOpts = ['All', 'East', 'West', 'North', 'South']

  const areas = Array.isArray(filters.areas) ? filters.areas : []
  const prices = Array.isArray(filters.prices) ? filters.prices : []

  const toggleMulti = (key, option, current) => {
    const next = current.includes(option) ? current.filter((x) => x !== option) : [...current, option]
    onFilterChange(key, next)
  }

  return (
    <aside className={`filters-sidebar ${hideResetButton ? 'filters-sidebar--embedded' : ''}`}>
      {!hideTitle && <h3 className="filters-title">Filters</h3>}

      <div className="filter-group">
        <label>Availability</label>
        <div className="filter-pill-grid" role="group" aria-label="Availability">
          {availabilityOpts.map((option) => {
            const active = filters.availability === option
            return (
              <button
                key={option}
                type="button"
                className={`filter-pill ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => onFilterChange('availability', option)}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-group">
        <label>Facing</label>
        <div className="filter-pill-grid" role="group" aria-label="Facing">
          {facingOpts.map((option) => {
            const active = filters.facing === option
            return (
              <button
                key={option}
                type="button"
                className={`filter-pill ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => onFilterChange('facing', option)}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-group">
        <label>Area (cent)</label>
        <p className="filter-pill-hint">Tap to select — none selected shows all areas.</p>
        <div className="filter-pill-grid" role="group" aria-label="Area buckets">
          {AREA_OPTIONS.map((option) => {
            const active = areas.includes(option)
            return (
              <button
                key={option}
                type="button"
                className={`filter-pill ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleMulti('areas', option, areas)}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-group">
        <label>Price range</label>
        <p className="filter-pill-hint">Tap to select — none selected shows all prices.</p>
        <div className="filter-pill-grid" role="group" aria-label="Price ranges">
          {PRICE_OPTIONS.map((option) => {
            const active = prices.includes(option)
            return (
              <button
                key={option}
                type="button"
                className={`filter-pill ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleMulti('prices', option, prices)}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      {!hideResetButton && (
        <button type="button" className="filters-reset" onClick={onReset}>
          Reset
        </button>
      )}
    </aside>
  )
}
