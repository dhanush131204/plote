import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') navigate('/platform/dashboard', { replace: true })
      else if (user.role === 'admin') navigate('/dashboard', { replace: true })
      else navigate('/buyer/projects', { replace: true })
    }
  }, [user, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedInUser = await login(email, password)
      if (loggedInUser.role === 'super_admin') navigate('/platform/dashboard')
      else if (loggedInUser.role === 'admin') navigate('/dashboard')
      else navigate('/buyer/projects')
    } catch (err) {
      setError(err.data?.error || err.error || err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-inner">
        <aside className="landing-aside">
          <p className="landing-kicker">Digital real estate showroom</p>
          <h1>PlotVision</h1>
          <p className="landing-lede">
            Create interactive plot and building experiences with live inventory, buyer enquiries, and CRM-ready leads.
          </p>
          <div className="landing-meta">
            <span>Interactive maps</span>
            <span>Public project links</span>
            <span>Lead capture</span>
          </div>
        </aside>
        <div className="landing-card">
          <h2 className="landing-card-title">Welcome back</h2>
          <p className="landing-card-sub">Sign in with the account provided by your administrator.</p>
          <form onSubmit={handleSubmit}>
            {error && <div className="landing-error">{error}</div>}
            <div className="landing-field">
              <label htmlFor="landing-email">Email or Username</label>
              <input
                id="landing-email"
                type="text"
                autoComplete="username"
                placeholder="you@example.com or admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="landing-field">
              <label htmlFor="landing-password">Password</label>
              <input
                id="landing-password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Log in'}
            </button>
          </form>
          <p className="landing-note">
            New accounts are created by your administrator. Buyers can open public project links shared by the sales team.
          </p>
        </div>
      </div>
    </div>
  )
}
