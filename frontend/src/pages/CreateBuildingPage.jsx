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
    <div className="app">
      <header className="header">
        {/* <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
          ← Dashboard
        </button> */}
        <h2 className="header-title">Create building layout</h2>
      </header>
      <main className="dashboard-main">
        <div className="dashboard-intro">
          <h1>Create building layout</h1>
          <p>
            Use per-floor 2D plans with unit outlines, a floor stack control, and a lightweight 3D preview. Optional
            Matterport or Sketchfab embeds are supported in settings.
          </p>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        <form onSubmit={handleSubmit} className="create-building-form">
          <label className="builder-field">
            Layout name{' '}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tower A — Phase 1"
              className="builder-input-block"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Continue to editor'}
          </button>
        </form>
      </main>
    </div>
  )
}
