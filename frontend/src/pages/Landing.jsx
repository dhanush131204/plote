import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
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
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-inner">
        <aside className="landing-aside">
          <p className="landing-kicker">Site plans, made clear</p>
          <h1>Plot Listing</h1>
          <p className="landing-lede">
            Upload your layout, mark each plot once, and share a single link buyers can explore—status, areas, and
            pricing in one place.
          </p>
          <div className="landing-meta">
            <span>Interactive map</span>
            <span>Public share links</span>
            <span>Lead-ready details</span>
          </div>
        </aside>
        <div className="landing-card">
          <h2 className="landing-card-title">Welcome back</h2>
          <p className="landing-card-sub">Sign in with the account provided by your administrator.</p>
          <form onSubmit={handleSubmit}>
            {error && <div className="landing-error">{error}</div>}
            <div className="landing-field">
              <label htmlFor="landing-email">Email</label>
              <input
                id="landing-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Please wait…' : 'Log in'}
            </button>
          </form>
          <p className="landing-note">
            <Link to="/v/demo">View demo map</Link> (no login, no API). New accounts are created by an administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
