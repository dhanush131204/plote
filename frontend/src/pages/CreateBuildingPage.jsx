import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateLayoutMutation } from '../api/apiSlice'
import { defaultBuilding } from '../utils/buildingSchema'

export default function CreateBuildingPage() {
  const [name, setName] = useState('')
  const [createLayout, { isLoading: creating }] = useCreateLayoutMutation()
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const created = await createLayout({
        name: name.trim() || 'Untitled building',
        layoutKind: 'building',
        building: defaultBuilding(),
      }).unwrap()
      const newId = created?.id
      if (newId == null) {
        setError('Server did not return a layout id. Check that the API is running and up to date.')
        return
      }
      navigate(`/layout/${newId}/edit/building`)
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create layout')
    }
  }

  return (
    <div className="builder-workspace">
      <header className="header" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', position: 'relative', zIndex: 10 }}>
        <h2 className="header-title" style={{ padding: '0 1.5rem' }}>Create building layout</h2>
      </header>
      
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div className="premium-wizard-card">
          <h3>Create building layout</h3>
          <p>
            Use per-floor 2D plans with unit outlines, a floor stack control, and a lightweight 3D preview. Optional
            Matterport or Sketchfab embeds are supported in settings.
          </p>
          
          {error && <div className="dashboard-error">{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            <label className="builder-field">
              Layout name{' '}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tower A — Phase 1"
                className="builder-input-block"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={creating} style={{ padding: '0.875rem' }}>
              {creating ? 'Creating…' : 'Continue to editor'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
