import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCreateAdminUserMutation } from '../api/apiSlice'

const initialFormState = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  password: '',
  role: 'admin',
}

export default function AddUserModal({ isOpen, onClose }) {
  const [createAdminUser] = useCreateAdminUserMutation()
  const [formState, setFormState] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setFormState(initialFormState)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { name, companyName, phone, role } = formState
    const email = formState.email.trim()
    const password = formState.password

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (!email.includes('@')) {
      setError('Enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setSaving(true)
      setError('')
      await createAdminUser({ email, password, role, name, companyName, phone }).unwrap()
      setFormState(initialFormState)
      onClose()
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="plot-interest-modal-root" role="dialog" aria-modal="true">
      <div className="plot-interest-modal-backdrop" onClick={onClose} />
      <div className="plot-interest-modal">
        <div className="plot-interest-modal-header">
          <h2 className="plot-interest-modal-title">Add New User</h2>
          <button type="button" className="plot-interest-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="plot-interest-modal-form" onSubmit={handleSubmit}>
          {error && <div className="dashboard-error">{error}</div>}

          <label className="plot-interest-label">
            <span>Builder / Admin Name</span>
            <input
              type="text"
              value={formState.name}
              onChange={handleChange('name')}
              className="panel-input"
              required
            />
          </label>

          <label className="plot-interest-label">
            <span>Company Name</span>
            <input
              type="text"
              value={formState.companyName}
              onChange={handleChange('companyName')}
              className="panel-input"
              required
            />
          </label>

          <label className="plot-interest-label">
            <span>Email Address</span>
            <input
              type="email"
              value={formState.email}
              onChange={handleChange('email')}
              className="panel-input"
              required
            />
          </label>

          <label className="plot-interest-label">
            <span>Phone Number</span>
            <input
              type="tel"
              value={formState.phone}
              onChange={handleChange('phone')}
              className="panel-input"
              required
            />
          </label>

          <label className="plot-interest-label">
            <span>Password</span>
            <input
              type="password"
              value={formState.password}
              onChange={handleChange('password')}
              className="panel-input"
              required
            />
          </label>

          <label className="plot-interest-label">
            <span>Role</span>
            <select
              value={formState.role}
              onChange={handleChange('role')}
              className="panel-input"
            >
              <option value="user">User / Buyer</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
