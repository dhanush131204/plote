import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()

  const initials = useMemo(() => {
    const email = user?.email || 'buyer'
    return email.slice(0, 1).toUpperCase()
  }, [user])

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

        <div className="profile-panel">
          <h2>Property preferences</h2>
          <div className="preference-pills">
            <span>Plots</span>
            <span>Apartments</span>
            <span>East facing</span>
            <span>Ready inventory</span>
          </div>
          <p className="profile-note">These preferences help the sales team suggest suitable plots and units.</p>
        </div>

        <div className="profile-panel">
          <h2>Need help?</h2>
          <p>Contact the project team from any plot detail panel using Call, WhatsApp, or Submit interest.</p>
          <a className="btn-primary profile-support-link" href="/buyer/projects">Explore projects</a>
        </div>
      </section>
    </div>
  )
}
