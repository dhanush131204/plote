import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUpdateAdminUserMutation } from '../api/apiSlice'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [updateAdminUser] = useUpdateAdminUserMutation()
  const navigate = useNavigate()

  const [editPassword, setEditPassword] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (editPassword.trim() && editPassword.trim().length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setEditSaving(true)
    setSaved(false)
    setError('')
    try {
      const body = {
        id: user.id,
        email: user.email,
        role: user.role,
        autoWebhookOnSubmit: user.autoWebhookOnSubmit,
      }
      if (editPassword.trim()) body.password = editPassword.trim()
      await updateAdminUser(body).unwrap()
      await refreshUser()
      setEditPassword('')
      setSaved(true)
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update profile')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className="dashboard-container">
      <section className="welcome-banner">
        <div className="welcome-content">
          <p className="section-kicker">Control room</p>
          <h1 className="welcome-title">Settings</h1>
          <p className="welcome-subtitle">Manage account security and project-level business controls.</p>
        </div>
      </section>

      {error && <div className="dashboard-error">{error}</div>}
      {saved && <div className="dashboard-success">Settings saved successfully.</div>}

      <section className="profile-grid">
        <div className="profile-panel">
          <h2>Account security</h2>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="builder-field">
              Email address
              <input type="email" value={user?.email || ''} disabled className="builder-input-block" />
            </label>
            <label className="builder-field">
              New password
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="builder-input-block"
              />
            </label>
            <button type="submit" className="btn-primary" disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save security settings'}
            </button>
          </form>
        </div>

        <div className="profile-panel">
          <h2>Project contact details</h2>
          <p>
            Public Call and WhatsApp buttons are controlled inside each project builder under Settings. This keeps
            every plot map or building connected to the correct sales contact.
          </p>
          <button type="button" className="btn-secondary profile-support-link" onClick={() => navigate('/projects')}>
            Manage projects
          </button>
        </div>

        <div className="profile-panel">
          <h2>CRM webhooks</h2>
          <p>
            Webhook URLs are saved per project, and lead auto-send is controlled per admin account. This prevents one
            project from accidentally sending leads to the wrong CRM pipeline.
          </p>
          <button type="button" className="btn-secondary profile-support-link" onClick={() => navigate('/customers')}>
            Manage accounts
          </button>
        </div>
      </section>
    </div>
  )
}
