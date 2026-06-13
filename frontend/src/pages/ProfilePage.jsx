import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUpdateProfileMutation, useGetAdminActivityQuery, useGetAdminLeadsQuery, useGetLayoutsQuery, useUploadLogoMutation, useDeleteLogoMutation } from '../api/apiSlice'

import toast from 'react-hot-toast'
const API_BASE = import.meta.env.VITE_API_URL || ''

export default function ProfilePage() {
  const { user, isAdmin, refreshUser } = useAuth()
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const [uploadLogo] = useUploadLogoMutation()
  const [deleteLogo] = useDeleteLogoMutation()

  // Insights data (only for admin)
  const { data: layouts = [], isLoading: layoutsLoading } = useGetLayoutsQuery(undefined, { skip: !isAdmin })
  const { data: leadsData, isLoading: leadsLoading } = useGetAdminLeadsQuery(100, { skip: !isAdmin })
  const { data: activityData, isLoading: activityLoading } = useGetAdminActivityQuery(200, { skip: !isAdmin })

  const leads = leadsData?.leads || []
  const events = activityData?.events || []

  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    gst: '',
    rera: '',
    website: '',
    about: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    documents: ''
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        companyName: user.companyName || '',
        phone: user.phone || '',
        alternatePhone: user.alternatePhone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        gst: user.gst || '',
        rera: user.rera || '',
        website: user.website || '',
        about: user.about || '',
        facebook: user.facebook || '',
        instagram: user.instagram || '',
        linkedin: user.linkedin || '',
        youtube: user.youtube || '',
        documents: user.documents || ''
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setMsg('')
    setError('')
    try {
      await updateProfile(formData).unwrap()
      await refreshUser()
      toast.success('Profile updated successfully.')
      setIsEditing(false)
    } catch (err) {
      toast.error(err.data?.error || err.message || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        companyName: user.companyName || '',
        phone: user.phone || '',
        alternatePhone: user.alternatePhone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        gst: user.gst || '',
        rera: user.rera || '',
        website: user.website || '',
        about: user.about || '',
        facebook: user.facebook || '',
        instagram: user.instagram || '',
        linkedin: user.linkedin || '',
        youtube: user.youtube || '',
        documents: user.documents || ''
      })
    }
    setIsEditing(false)
    setMsg('')
    setError('')
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMsg('')
    setError('')
    const fd = new FormData()
    fd.append('logo', file)
    try {
      await uploadLogo(fd).unwrap()
      await refreshUser()
      toast.success('Logo uploaded successfully.')
    } catch (err) {
      toast.error(err.data?.error || err.message || 'Failed to upload logo')
    }
  }

  const handleLogoDelete = async () => {
    setMsg('')
    setError('')
    try {
      await deleteLogo().unwrap()
      await refreshUser()
      toast.success('Logo removed.')
    } catch (err) {
      toast.error(err.data?.error || err.message || 'Failed to remove logo')
    }
  }

  const initials = useMemo(() => {
    const email = user?.email || 'buyer'
    return email.slice(0, 1).toUpperCase()
  }, [user])

  const projectStats = useMemo(() => {
    return layouts.map((layout) => {
      const projectEvents = events.filter((event) => String(event.layoutId) === String(layout.id))
      const projectLeads = leads.filter((lead) => String(lead.layoutId) === String(layout.id))
      const plots = layout.plots || []
      return {
        id: layout.id,
        name: layout.name,
        slug: layout.slug,
        type: layout.layoutKind === 'building' ? 'Building' : 'Plot Map',
        views: projectEvents.filter((event) => event.eventType === 'page_view').length,
        selections: projectEvents.filter((event) => event.eventType === 'plot_select').length,
        leads: projectLeads.length,
        available: plots.filter((plot) => (plot.status || 'Available').toLowerCase() === 'available').length,
      }
    }).sort((a, b) => (b.views + b.selections + b.leads) - (a.views + a.selections + a.leads))
  }, [layouts, events, leads])

  // Buyer view — simple read-only
  if (!isAdmin) {
    return (
      <div className="dashboard-container">
        <section className="welcome-banner">
          <div className="welcome-content">
            <p className="section-kicker">Buyer profile</p>
            <h1 className="welcome-title">Profile</h1>
            <p className="welcome-subtitle">Your contact details, property preferences, and support options.</p>
          </div>
          <div className="profile-hero-avatar" aria-hidden>{initials}</div>
        </section>

        <section className="profile-grid">
          <div className="profile-panel">
            <h2>Contact identity</h2>
            <div className="profile-row">
              <span>Email</span>
              <strong>{user?.email || 'Not available'}</strong>
            </div>
            <div className="profile-row">
              <span>Account type</span>
              <strong>{user?.role === 'admin' ? 'Admin' : 'Buyer'}</strong>
            </div>
            <p className="profile-note">Your saved and interested properties are connected to this account email.</p>
          </div>
        </section>
      </div>
    )
  }

  const insightsLoading = layoutsLoading || leadsLoading || activityLoading

  // Admin / Builder view — tabs for Profile + Insights
  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-left">
          <div className="cp-avatar" style={{ position: 'relative', overflow: 'visible', width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--color-accent), #38b2ac)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.logo ? (
              <img 
                src={`${API_BASE}/uploads/${user.logo}`} 
                alt="Logo" 
                style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover', display: 'block' }} 
              />
            ) : (
              initials
            )}
            
            {/* Pencil icon for upload logo */}
            <label 
              htmlFor="logo-upload-input" 
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '20px',
                height: '20px',
                background: '#0d9488',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid #fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title="Upload Logo"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              <input 
                type="file" 
                id="logo-upload-input" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                style={{ display: 'none' }} 
              />
            </label>

            {/* X icon for removing logo */}
            {user?.logo && (
              <button 
                type="button" 
                onClick={handleLogoDelete}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '20px',
                  height: '20px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: 0,
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  lineHeight: 1
                }}
                title="Remove Logo"
              >
                ×
              </button>
            )}
          </div>
          <div>
            <h1 className="cp-title">{formData.companyName || user?.email || 'Company Profile'}</h1>
            <p className="cp-subtitle">{user?.email} · Builder Account</p>
          </div>
        </div>
        {activeTab === 'profile' && (
          <div className="cp-header-actions">
            {isEditing ? (
              <>
                <button className="btn-secondary" onClick={handleCancel} type="button">Cancel</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={isLoading} type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => setIsEditing(true)} type="button">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Success / Error */}

      {error && <div className="cp-toast cp-toast--error">{error}</div>}

      {/* Tabs */}
      <div className="cp-tabs">
        <button className={`cp-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Builder Details
        </button>
        <button className={`cp-tab ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Insights
        </button>
      </div>

      {/* TAB: Profile */}
      {activeTab === 'profile' && (
        <form className="cp-form" onSubmit={handleSubmit}>
          {/* General Information */}
          <div className="cp-section">
            <div className="cp-section-head">
              <h3>General Information</h3>
              <p>Basic company and contact details visible on your public projects.</p>
            </div>
            <div className="cp-fields">
              <div className="cp-field">
                <label>Company Name</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. Acme Builders" disabled={!isEditing} />
              </div>
              <div className="cp-field">
                <label>Personal name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" disabled={!isEditing} />
              </div>
              <div className="cp-field">
                <label>Primary Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" disabled={!isEditing} />
              </div>
              <div className="cp-field">
                <label>Alternate Phone</label>
                <input type="text" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="cp-field cp-field--full">
                <label>About Company</label>
                <textarea name="about" rows="3" value={formData.about} onChange={handleChange} placeholder="Brief description of your company..." disabled={!isEditing}></textarea>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="cp-section">
            <div className="cp-section-head">
              <h3>Address</h3>
              <p>Office location shown on your company profile.</p>
            </div>
            <div className="cp-fields">
              <div className="cp-field cp-field--full">
                <label>Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="cp-field">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="cp-field">
                <label>State / Province</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="cp-field">
                <label>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} disabled={!isEditing} />
              </div>
            </div>
          </div>

          {/* Business Registration */}
          <div className="cp-section">
            <div className="cp-section-head">
              <h3>Business Registration</h3>
              <p>Government registration numbers for verification.</p>
            </div>
            <div className="cp-fields">
              <div className="cp-field">
                <label>GST Number</label>
                <input type="text" name="gst" value={formData.gst} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="cp-field">
                <label>RERA Registration</label>
                <input type="text" name="rera" value={formData.rera} onChange={handleChange} disabled={!isEditing} />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB: Insights */}
      {activeTab === 'insights' && (
        <div className="cp-insights">
          {insightsLoading ? (
            <div className="app-loading">Loading insights...</div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="cp-kpi-grid">
                <div className="cp-kpi-card">
                  <div className="cp-kpi-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div className="cp-kpi-body">
                    <span className="cp-kpi-label">Total Activity</span>
                    <span className="cp-kpi-value">{events.length}</span>
                  </div>
                </div>
                <div className="cp-kpi-card">
                  <div className="cp-kpi-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <div className="cp-kpi-body">
                    <span className="cp-kpi-label">Most Active</span>
                    <span className="cp-kpi-value cp-kpi-value--text">{projectStats[0]?.name || '—'}</span>
                  </div>
                </div>
                <div className="cp-kpi-card">
                  <div className="cp-kpi-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div className="cp-kpi-body">
                    <span className="cp-kpi-label">Conversion</span>
                    <span className="cp-kpi-value">{events.length ? `${Math.round((leads.length / Math.max(events.length, 1)) * 100)}%` : '0%'}</span>
                  </div>
                </div>
                <div className="cp-kpi-card">
                  <div className="cp-kpi-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </div>
                  <div className="cp-kpi-body">
                    <span className="cp-kpi-label">Available Units</span>
                    <span className="cp-kpi-value" style={{ color: 'var(--color-available)' }}>{projectStats.reduce((sum, item) => sum + item.available, 0)}</span>
                  </div>
                </div>
              </div>

              {/* Engagement Table */}
              <div className="cp-table-section">
                <h3>Project Engagement</h3>
                <div className="cp-table-wrap">
                  <table className="cp-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Type</th>
                        <th>Views</th>
                        <th>Selections</th>
                        <th>Leads</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectStats.map((item) => (
                        <tr key={item.id}>
                          <td className="cp-table-name">{item.name}</td>
                          <td><span className="project-card-kind-badge">{item.type}</span></td>
                          <td>{item.views}</td>
                          <td>{item.selections}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{item.leads}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-available)' }}>{item.available}</td>
                        </tr>
                      ))}
                      {projectStats.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No projects yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
