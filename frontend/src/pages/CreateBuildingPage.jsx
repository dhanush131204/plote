import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCreateLayoutMutation } from '../api/apiSlice'
import { defaultBuilding } from '../utils/buildingSchema'

export default function CreateBuildingPage() {
  const [createLayout, { isLoading: creating }] = useCreateLayoutMutation()
  const [name, setName] = useState('Untitled building')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Building name is required.')
      return
    }
    setError('')
    try {
      const created = await createLayout({
        name: name.trim(),
        layoutKind: 'building',
        building: defaultBuilding(),
      }).unwrap()
      
      const newId = created?.id
      if (newId != null) {
        toast.success(`Building project "${name}" created successfully!`)
        navigate(`/layout/${newId}/edit/building`, { replace: true })
      } else {
        setError('Server did not return a layout ID.')
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create layout')
    }
  }

  return (
    <div className="dashboard-container">
      <section className="welcome-banner">
        <div className="welcome-content">
          <p className="section-kicker">New Project</p>
          <h1 className="welcome-title">Create Building Workspace</h1>
          <p className="welcome-subtitle">Set up the initial workspace properties for your building layout.</p>
        </div>
      </section>

      {error && <div className="dashboard-error">{error}</div>}

      <section className="profile-grid" style={{ marginTop: '1.5rem', maxWidth: '600px' }}>
        <div className="profile-panel">
          <h2>Workspace Properties</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <label className="builder-field">
              Building Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Green Crest Apartments"
                className="builder-input-block"
                style={{ marginTop: '0.5rem' }}
                disabled={creating}
              />
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
