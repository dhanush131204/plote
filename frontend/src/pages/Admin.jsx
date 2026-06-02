import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useGetAdminUsersQuery,
  useGetAdminLeadsQuery,
  useGetAdminActivityQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  usePushLeadWebhookMutation,
} from '../api/apiSlice'

export default function Admin() {
  const navigate = useNavigate()
  const { user, logout, refreshUser } = useAuth()
  const [tab, setTab] = useState('users')
  const [error, setError] = useState('')

  const { data: users = [], isLoading: loadingUsers, error: errorUsers } = useGetAdminUsersQuery()
  const { data: leadsData, isLoading: loadingLeads, error: errorLeads } = useGetAdminLeadsQuery(100)
  const { data: eventsData, isLoading: loadingActivity, error: errorActivity, refetch: refetchActivity } = useGetAdminActivityQuery(200)

  const [createAdminUser] = useCreateAdminUserMutation()
  const [updateAdminUser] = useUpdateAdminUserMutation()
  const [pushWebhookTrigger] = usePushLeadWebhookMutation()

  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newAutoWebhook, setNewAutoWebhook] = useState(false)

  const [editUser, setEditUser] = useState(null)
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('user')
  const [editAutoWebhook, setEditAutoWebhook] = useState(false)
  const [editPassword, setEditPassword] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const leads = leadsData?.leads || []
  const leadsTotal = leadsData?.total ?? 0
  const events = eventsData?.events || []

  useEffect(() => {
    const err = errorUsers || errorLeads || errorActivity
    if (err) {
      setError(err.data?.error || err.error || 'Failed to fetch admin data')
    }
  }, [errorUsers, errorLeads, errorActivity])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createAdminUser({
        email: newEmail,
        password: newPassword,
        autoWebhookOnSubmit: newAutoWebhook,
      }).unwrap()
      setNewEmail('')
      setNewPassword('')
      setNewAutoWebhook(false)
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create user')
    }
  }

  const openEditUser = (u) => {
    setError('')
    setEditUser(u)
    setEditEmail(u.email)
    setEditRole(u.role === 'admin' ? 'admin' : 'user')
    setEditAutoWebhook(Boolean(u.autoWebhookOnSubmit))
    setEditPassword('')
  }

  const closeEditUser = () => {
    setEditUser(null)
    setEditPassword('')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editUser) return
    if (editPassword.trim() && editPassword.trim().length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setEditSaving(true)
    setError('')
    try {
      const body = {
        id: editUser.id,
        email: editEmail.trim(),
        role: editRole,
        autoWebhookOnSubmit: editAutoWebhook,
      }
      if (editPassword.trim()) {
        body.password = editPassword.trim()
      }
      await updateAdminUser(body).unwrap()
      if (user?.id === editUser.id) {
        await refreshUser()
      }
      closeEditUser()
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update user')
    } finally {
      setEditSaving(false)
    }
  }

  const pushLeadWebhook = async (leadId) => {
    setError('')
    try {
      await pushWebhookTrigger(leadId).unwrap()
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to push webhook')
    }
  }

  const loading = loadingUsers || loadingLeads || loadingActivity

  if (loading) return <div className="app-loading">Loading…</div>

  return (
    <div className="app">
      <header className="header">
        <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
          ← Dashboard
        </button>
        <h2 className="header-title">Admin</h2>
        <div className="header-actions">
          <span className="header-tagline" title={user?.email || ''}>
            {user?.email}
          </span>
          <button type="button" onClick={logout} className="btn-ghost">
            Log out
          </button>
        </div>
      </header>
      <main className="dashboard-main admin-main">
        {error && <div className="dashboard-error">{error}</div>}

        <nav className="admin-tabs" aria-label="Admin sections">
          {['users', 'leads', 'activity'].map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setTab(t)}
            >
              {t === 'users' ? 'Users' : t === 'leads' ? 'Leads' : 'Activity'}
            </button>
          ))}
        </nav>

        {tab === 'users' && (
          <section className="admin-section">
            <h1>Company users</h1>
            <p className="admin-lede">Create accounts that can log in and manage layouts. Auto webhook sends CRM payloads on interest submit when enabled per user.</p>

            <form className="admin-form" onSubmit={handleCreateUser}>
              <h3>Create user</h3>
              <label className="builder-field">
                Email
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </label>
              <label className="builder-field">
                Password
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </label>
              <label className="admin-checkbox">
                <input type="checkbox" checked={newAutoWebhook} onChange={(e) => setNewAutoWebhook(e.target.checked)} />
                Auto-send to layout webhook on interest submit
              </label>
              <button type="submit" className="btn-primary">
                Create user
              </button>
            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Auto webhook</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.autoWebhookOnSubmit ? 'On' : 'Off'}</td>
                      <td>{u.createdAt}</td>
                      <td>
                        <button type="button" className="btn-secondary btn-small" onClick={() => openEditUser(u)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'leads' && (
          <section className="admin-section">
            <h1>Interest leads ({leadsTotal})</h1>
            <p className="admin-lede">Push to webhook uses each layout&apos;s webhook URL. Delivery status is shown after auto or manual send.</p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Layout</th>
                    <th>Plot / unit</th>
                    <th>Floor</th>
                    <th>Tower</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Webhook</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id}>
                      <td>{l.createdAt}</td>
                      <td>{l.layoutName}</td>
                      <td>{l.unitId || l.plotId}</td>
                      <td>{l.unitFloor ?? '—'}</td>
                      <td>{l.unitTower ?? '—'}</td>
                      <td>{l.customerName}</td>
                      <td>{l.contactNumber}</td>
                      <td>{l.customerEmail}</td>
                      <td>
                        {l.webhookDeliveredAt ? (
                          <span title={l.webhookLastError || ''}>Sent {l.webhookDeliveredAt}</span>
                        ) : l.webhookLastError ? (
                          <span className="admin-error-inline" title={l.webhookLastError}>
                            Failed
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button type="button" className="btn-secondary btn-small" onClick={() => pushLeadWebhook(l.id)}>
                          Push webhook
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'activity' && (
          <section className="admin-section">
            <h1>Public activity</h1>
            <p className="admin-lede">Anonymous session events from the public map (browser session id in localStorage).</p>
            <button type="button" className="btn-secondary admin-refresh" onClick={() => refetchActivity()}>
              Refresh
            </button>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Layout</th>
                    <th>Session</th>
                    <th>Event</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id}>
                      <td>{ev.createdAt}</td>
                      <td>{ev.layoutId}</td>
                      <td className="admin-cell-mono">{ev.sessionId?.slice(0, 8)}…</td>
                      <td>{ev.eventType}</td>
                      <td className="admin-cell-json">{ev.payload ? JSON.stringify(ev.payload) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {editUser && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={closeEditUser}
          onKeyDown={(e) => e.key === 'Escape' && closeEditUser()}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="admin-edit-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-edit-user-title">Edit user</h3>
            <p className="admin-modal-sub">{editUser.email}</p>
            <form onSubmit={handleSaveEdit}>
              <label className="builder-field">
                Email
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required autoComplete="off" />
              </label>
              <label className="builder-field">
                Role
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={editAutoWebhook}
                  onChange={(e) => setEditAutoWebhook(e.target.checked)}
                />
                Auto-send to layout webhook on interest submit
              </label>
              <label className="builder-field">
                New password <span className="admin-optional">(optional)</span>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />
              </label>
              <p className="admin-modal-hint">You cannot remove the last administrator. Demoting yourself requires another admin account.</p>
              <div className="admin-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEditUser}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
