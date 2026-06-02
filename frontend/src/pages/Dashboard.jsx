import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGetLayoutsQuery, useDeleteLayoutMutation } from '../api/apiSlice'

const API_BASE = import.meta.env.VITE_API_URL || ''

function NewLayoutDropdown({ align = 'end' }) {
  const navigate = useNavigate()
  const detailsRef = useRef(null)

  const go = (path) => {
    navigate(path)
    if (detailsRef.current) detailsRef.current.open = false
  }

  return (
    <details
      ref={detailsRef}
      className={`dashboard-new-layout dashboard-new-layout--align-${align}`}
    >
      <summary className="btn-primary dashboard-new-layout-summary">
        New layout
        <span className="dashboard-new-layout-chevron" aria-hidden />
      </summary>
      <div className="dashboard-new-layout-menu" role="menu">
        <button type="button" className="dashboard-new-layout-item" role="menuitem" onClick={() => go('/create')}>
          <span className="dashboard-new-layout-item-title">Plot map</span>
          <span className="dashboard-new-layout-item-desc">Site plan — calibrate plots on your map</span>
        </button>
        <button
          type="button"
          className="dashboard-new-layout-item"
          role="menuitem"
          onClick={() => go('/create/building')}
        >
          <span className="dashboard-new-layout-item-title">Building / apartments</span>
          <span className="dashboard-new-layout-item-desc">Facade, floors, units &amp; calibrate</span>
        </button>
      </div>
    </details>
  )
}

export default function Dashboard() {
  const { data: layouts = [], isLoading: loading, error: queryError } = useGetLayoutsQuery()
  const [deleteLayout] = useDeleteLayoutMutation()
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState(null)
  const { user, logout, isAdmin, refreshUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (queryError) {
      setError(queryError.data?.error || queryError.error || 'Failed to fetch layouts')
    }
  }, [queryError])

  const handleDelete = async (id) => {
    if (!confirm('Delete this layout?')) return
    try {
      await deleteLayout(id).unwrap()
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to delete layout')
    }
  }


  const copyLink = (slug) => {
    const url = `${window.location.origin}/v/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    window.setTimeout(() => setCopiedSlug(null), 2200)
  }

  if (loading) return <div className="app-loading">Loading...</div>

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">Plot Listing</div>
        <div className="header-actions">
          <span className="header-tagline" title={user?.email || ''}>
            {user?.email}
          </span>
          {isAdmin && (
            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">
              Admin
            </button>
          )}
          {isAdmin && <NewLayoutDropdown align="end" />}
          <button type="button" onClick={logout} className="btn-ghost">
            Log out
          </button>
        </div>
      </header>
      <main className="dashboard-main">
        <div className="dashboard-intro">
          <h1>Your layouts</h1>
          <p>
            {isAdmin 
              ? 'Create a plot map from a site plan, or a building / apartment layout with floors, facade, and units. Share a public link with your team or buyers.'
              : 'Browse plot maps and building / apartment layouts with floors, facade, and units. View details or copy public share links.'
            }
          </p>
          {!isAdmin && (
            <p className="dashboard-admin-hint">
              Ask your org admin to promote your account to edit or create layouts.
            </p>
          )}
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        {layouts.length === 0 ? (
          <div className="dashboard-empty">
            <p>{isAdmin ? 'No layouts yet. Create a new layout and pick the type:' : 'No layouts available.'}</p>
            {isAdmin && (
              <div className="dashboard-empty-actions">
                <NewLayoutDropdown align="center" />
              </div>
            )}
            {isAdmin && (
              <p className="dashboard-empty-hint">
                Building layouts include apartments / homes: floors, facades, 2 BHK / 3 BHK steps, and unit maps.
              </p>
            )}
          </div>
        ) : (
          <div className="dashboard-grid">
            {layouts.map((layout) => (
              <div key={layout.id} className="dashboard-card">
                {layout.imagePath ? (
                  <img
                    src={`${API_BASE}/uploads/${layout.imagePath}`}
                    alt={layout.name}
                    className="dashboard-card-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="dashboard-card-placeholder">No image</div>
                )}
                <div className="dashboard-card-body">
                  <h3>{layout.name}</h3>
                  <p className="dashboard-card-slug">
                    /v/{layout.slug}
                    {layout.layoutKind === 'building' && (
                      <span className="dashboard-card-kind" title="Apartment / building layout">
                        {' '}
                        · Building
                      </span>
                    )}
                  </p>
                  <div className="dashboard-card-actions">
                    <button
                      type="button"
                      className="dashboard-card-action-btn"
                      data-tooltip="Copy link"
                      onClick={() => copyLink(layout.slug)}
                      aria-label="Copy link"
                    >
                      <span className="dashboard-card-action-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      </span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="dashboard-card-action-btn"
                        data-tooltip="Edit"
                        onClick={() =>
                          navigate(
                            layout.layoutKind === 'building'
                              ? `/layout/${layout.id}/edit/building`
                              : `/layout/${layout.id}/edit`
                          )
                        }
                        aria-label="Edit"
                      >
                        <span className="dashboard-card-action-icon" aria-hidden>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="dashboard-card-action-btn"
                      data-tooltip="View"
                      onClick={() => window.open(`/v/${layout.slug}`, '_blank')}
                      aria-label="View"
                    >
                      <span className="dashboard-card-action-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="dashboard-card-action-btn dashboard-card-action-btn-danger"
                        data-tooltip="Delete"
                        onClick={() => handleDelete(layout.id)}
                        aria-label="Delete"
                      >
                        <span className="dashboard-card-action-icon" aria-hidden>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"/></svg>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {copiedSlug && (
        <div className="toast-inline" role="status" aria-live="polite">
          Link copied — /v/{copiedSlug}
        </div>
      )}
    </div>
  )
}
