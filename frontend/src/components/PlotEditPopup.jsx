import { useState, useEffect } from 'react'

export default function PlotEditPopup({ plot, onSave, onClose, buildingMode = false, floors = [], towers = [] }) {
  const deriveConfigId = (beds) => {
    if (beds === 1) return '1bhk'
    if (beds === 2) return '2bhk'
    if (beds === 3) return '3bhk'
    if (beds === 4) return '4bhk'
    if (beds === 0) return 'studio'
    return 'custom'
  }

  const [form, setForm] = useState({
    number: 101,
    floor: '',
    tower: 'A',
    beds: 2,
    configId: '2bhk',
    areaCent: 0,
    areaSqft: 0,
    facing: 'East',
    status: 'Available',
    pricePerSqft: 0,
    estimatedPrice: 0,
  })

  useEffect(() => {
    if (plot) {
      setForm({
        number: plot.number ?? 101,
        floor: plot.floor ?? '',
        tower: plot.tower ?? towers[0]?.id ?? 'A',
        beds: plot.beds ?? 2,
        configId: plot.configId ?? deriveConfigId(plot.beds ?? 2),
        areaCent: plot.areaCent ?? 0,
        areaSqft: plot.areaSqft ?? 0,
        facing: plot.facing ?? 'East',
        status: plot.status ?? 'Available',
        pricePerSqft: plot.pricePerSqft ?? 0,
        estimatedPrice: plot.estimatedPrice ?? 0,
      })
    }
  }, [plot])

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'areaSqft' || key === 'pricePerSqft') {
        const sqft = key === 'areaSqft' ? (typeof value === 'number' ? value : parseFloat(value) || 0) : prev.areaSqft
        const pps = key === 'pricePerSqft' ? (typeof value === 'number' ? value : parseInt(value, 10) || 0) : prev.pricePerSqft
        next.estimatedPrice = sqft * pps
      }
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!plot) return
    onSave?.({ ...plot, ...form })
    onClose?.()
  }

  if (!plot) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="plot-edit-title">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal-content plot-edit-popup">
        <div className="modal-header">
          <h2 id="plot-edit-title">
            {buildingMode ? 'Edit unit' : 'Edit Plot'} #{form.number || plot.number}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="plot-edit-field">
            <span>{buildingMode ? 'Unit number' : 'Plot number'}</span>
            <input
              type="number"
              min={1}
              value={form.number}
              onChange={(e) => handleChange('number', parseInt(e.target.value, 10) || 101)}
              title="Change to rename this plot"
            />
          </label>
          {buildingMode && (
            <>
              <label className="plot-edit-field">
                <span>Floor</span>
                <select
                  value={form.floor}
                  onChange={(e) => handleChange('floor', e.target.value)}
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label && !/^f\d+$/.test(f.label) ? f.label : `Floor ${(f.sortOrder ?? 0) + 1}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="plot-edit-field">
                <span>Tower</span>
                <select
                  value={form.tower}
                  onChange={(e) => handleChange('tower', e.target.value)}
                >
                  {towers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label || t.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="plot-edit-field">
                <span>Unit Type</span>
                <select
                  value={form.configId}
                  onChange={(e) => {
                    const cid = e.target.value
                    let b = form.beds
                    if (cid === '1bhk') b = 1
                    else if (cid === '2bhk') b = 2
                    else if (cid === '3bhk') b = 3
                    else if (cid === '4bhk') b = 4
                    else if (cid === 'studio') b = 0
                    
                    setForm(prev => ({
                      ...prev,
                      configId: cid,
                      beds: b
                    }))
                  }}
                >
                  <option value="1bhk">1 BHK</option>
                  <option value="2bhk">2 BHK</option>
                  <option value="3bhk">3 BHK</option>
                  <option value="4bhk">4 BHK</option>
                  <option value="studio">Studio</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="plot-edit-field">
                <span>Bedrooms</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={1}
                  disabled={form.configId !== 'custom'}
                  value={form.beds}
                  onChange={(e) => handleChange('beds', parseInt(e.target.value, 10) || 0)}
                />
              </label>
            </>
          )}
          <label className="plot-edit-field">
            <span>Area (cent)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.areaCent}
              onChange={(e) => handleChange('areaCent', parseFloat(e.target.value) || 0)}
            />
          </label>
          <label className="plot-edit-field">
            <span>Area (sqft)</span>
            <input
              type="number"
              min={0}
              value={form.areaSqft}
              onChange={(e) => handleChange('areaSqft', parseInt(e.target.value, 10) || 0)}
            />
          </label>
          <label className="plot-edit-field">
            <span>Facing</span>
            <select
              value={form.facing}
              onChange={(e) => handleChange('facing', e.target.value)}
            >
              {['East', 'West', 'North', 'South'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="plot-edit-field">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {['Available', 'Booked', 'Sold'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="plot-edit-field">
            <span>Price per sqft (₹)</span>
            <input
              type="number"
              min={0}
              value={form.pricePerSqft}
              onChange={(e) => handleChange('pricePerSqft', parseInt(e.target.value, 10) || 0)}
            />
          </label>
          <label className="plot-edit-field">
            <span>Estimated price (₹)</span>
            <input
              type="number"
              min={0}
              value={form.estimatedPrice}
              onChange={(e) => handleChange('estimatedPrice', parseInt(e.target.value, 10) || 0)}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
