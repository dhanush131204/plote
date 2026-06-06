import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGetLayoutsQuery, useDeleteLayoutMutation } from '../api/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const { data: layouts = [], isLoading: loading, error: queryError } = useGetLayoutsQuery();
  const [deleteLayout] = useDeleteLayoutMutation();
  const [error, setError] = useState('');
  const { user, isAdmin, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (loading) return <div className="app-loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome back, {user?.email?.split('@')[0]}</h1>
          <p className="welcome-subtitle">Here's what's happening with your properties today.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{layouts.length}</span>
            <span className="stat-label">Total Layouts</span>
          </div>
          {isAdmin && (
            <div className="stat-badge">
              <span className="stat-value">{layouts.filter(l => l.layoutKind === 'building').length}</span>
              <span className="stat-label">Buildings</span>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions (Admin Only) */}
      {isAdmin && (
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <button className="action-card" onClick={() => navigate('/create')}>
              <div className="action-icon">🗺️</div>
              <div className="action-text">
                <h3>Create Plot Map</h3>
                <p>Site plan & calibrate plots</p>
              </div>
            </button>
            <button className="action-card" onClick={() => navigate('/create/building')}>
              <div className="action-icon">🏢</div>
              <div className="action-text">
                <h3>Create Building</h3>
                <p>Facade, floors, units</p>
              </div>
            </button>
            <button className="action-card" onClick={() => navigate('/admin')}>
              <div className="action-icon">👥</div>
              <div className="action-text">
                <h3>View Leads</h3>
                <p>Check interested buyers</p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Projects Grid */}
      <section className="projects-section">
        <div className="section-header">
          <h2 className="section-title">Recent Projects</h2>
          {isAdmin && <button className="btn-ghost" onClick={() => navigate('/layouts')}>View All</button>}
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        {layouts.length === 0 ? (
          <div className="empty-state-premium">
            <div className="empty-illustration">🏗️</div>
            <h3>No projects available yet</h3>
            <p>Get started by creating your first plot map or building layout to show to buyers.</p>
            {isAdmin && (
              <button className="btn-primary" onClick={() => navigate('/create')}>Create First Project</button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {layouts.slice(0, 6).map((layout) => (
              <div key={layout.id} className="project-card">
                <div className="project-card-image">
                  {layout.imagePath ? (
                    <img src={`${API_BASE}/uploads/${layout.imagePath}`} alt={layout.name} loading="lazy" />
                  ) : (
                    <div className="project-card-placeholder">No Image</div>
                  )}
                  <span className="project-badge">{layout.layoutKind === 'building' ? 'Building' : 'Plot Map'}</span>
                </div>
                <div className="project-card-content">
                  <h3 className="project-title">{layout.name}</h3>
                  <div className="project-meta">
                    <span className="project-meta-item">📍 {layout.location || 'Location not set'}</span>
                  </div>
                  <div className="project-card-actions">
                    <button className="btn-primary" onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                      View Project
                    </button>
                    {isAdmin && (
                      <button className="btn-secondary" onClick={() => navigate(layout.layoutKind === 'building' ? `/layout/${layout.id}/edit/building` : `/layout/${layout.id}/edit`)}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <h2 className="section-title">Recent Activity</h2>
        <div className="empty-state-premium mini">
          <p>Activity log is caught up.</p>
        </div>
      </section>
    </div>
  );
}
