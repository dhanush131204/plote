import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGetLayoutsQuery, useGetAdminLeadsQuery, useDeleteLayoutMutation } from '../api/apiSlice';
import { normalizeDateValue } from '../utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const { user, isAdmin, refreshUser } = useAuth();
  const { data: layouts = [], isLoading: loading } = useGetLayoutsQuery();
  const { data: leadsData } = useGetAdminLeadsQuery(5, { skip: !isAdmin });
  const [deleteLayout] = useDeleteLayoutMutation();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const formatDate = (value) => {
    const normalized = normalizeDateValue(value);
    if (!normalized) return '—';

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '—';
    return date.toLocaleDateString();
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (loading) return <div className="app-loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <p className="section-kicker">{isAdmin ? 'Admin studio' : 'Buyer space'}</p>
          <h1 className="welcome-title">Welcome back, {user?.email?.split('@')[0]}</h1>
          <p className="welcome-subtitle">Here's what's happening with your properties today.</p>
        </div>
        {isAdmin ? (
          <div className="welcome-stats">
            <div className="stat-badge">
              <span className="stat-value">{(layouts || []).length}</span>
              <span className="stat-label">Total Layouts</span>
            </div>
              <div className="stat-badge">
                <span className="stat-value">{(layouts || []).filter(l => l?.layoutKind !== 'building').length}</span>
                <span className="stat-label">Plot Maps</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value">{(layouts || []).filter(l => l?.layoutKind === 'building').length}</span>
                <span className="stat-label">Buildings</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value">{leadsData?.total || 0}</span>
                <span className="stat-label">Leads</span>
              </div>
          </div>
        ) : (
          <div className="welcome-stats">
            <div className="stat-badge">
              <span className="stat-value">{(layouts || []).length}</span>
              <span className="stat-label">Total Projects</span>
            </div>            
          </div>
        )}
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
            <button className="action-card" onClick={() => navigate('/admin/leads')}>
              <div className="action-icon">👥</div>
              <div className="action-text">
                <h3>View Leads</h3>
                <p>Check interested buyers</p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Projects Grid (for both admin and buyer, but buyer sees all, admin sees recent) */}
      <section className="projects-section" style={{marginBottom: '3rem'}}>
        <div className="section-header">
          <h2 className="section-title">{isAdmin ? 'Recent Projects' : 'Explore Projects'}</h2>
          <button className="btn-ghost" onClick={() => navigate(isAdmin ? '/projects' : '/buyer/projects')}>
            {isAdmin ? 'View All' : 'View All Projects'}
          </button>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        {(!layouts || layouts.length === 0) ? (
          <div className="empty-state-premium">
            <div className="empty-illustration">🏗️</div>
            <h3>{isAdmin ? "No projects available yet" : "No projects found"}</h3>
            <p>{isAdmin ? "Get started by creating your first plot map or building layout to show to buyers." : "There are no projects available to browse at this time. Please check back later."}</p>
            {isAdmin && (<button className="btn-primary" onClick={() => navigate('/create')}>Create First Project</button>)}
          </div>
        ) : (
          <div className="projects-grid">
            {/* Buyers see all projects, while admins get a "recent" overview on the dashboard */}
            {(isAdmin ? (layouts || []).slice(0, 4) : (layouts || [])).map((layout) => {
              const isBuilding = layout.layoutKind === 'building';
              const plots = layout.plots || [];
              
              // Calculate statistics dynamically
              const totalPlots = layout.totalPlots ?? plots.length;
              const availablePlots = layout.availablePlots ?? plots.filter(p => p.status?.toLowerCase() === "available").length;
              const soldPlots = layout.soldPlots ?? plots.filter(p => p.status?.toLowerCase() === "sold").length;

              return (
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
                    <div className="project-stats-summary" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <span>Total: {totalPlots}</span>
                      <span style={{ color: 'var(--color-available)' }}>Avail: {availablePlots}</span>
                      <span style={{ color: 'var(--color-danger)' }}>Sold: {soldPlots}</span>
                    </div>
                  </div>
                  <div className="project-card-actions">
                    <button className="btn-primary" onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button className="btn-secondary" onClick={() => navigate(layout.layoutKind === 'building' ? `/layout/${layout.id}/edit/building` : `/layout/${layout.id}/edit`)}>
                          Edit
                        </button>
                        <button className="btn-secondary btn-danger" onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this layout?')) {
                            await deleteLayout(layout.id);
                          }
                        }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </section>

      {/* Recent Leads (Admin Only) */}
      {isAdmin && (
        <section className="activity-section" style={{marginBottom: '3rem'}}>
          <div className="section-header">
            <h2 className="section-title">Recent Leads</h2>
            <button className="btn-ghost" onClick={() => navigate('/admin/leads')}>View All</button>
          </div>
          {(!leadsData?.leads || leadsData.leads.length === 0) ? (
            <div className="empty-state-premium mini">
              <p>No recent leads.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr style={{background: 'var(--color-bg-wash)'}}>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Project</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {(leadsData?.leads || []).slice(0, 5).map(l => (
                    <tr key={l.id}>
                      <td>{formatDate(l.createdAt)}</td>
                      <td style={{fontWeight: '500'}}>{l.customerName}</td>
                      <td>{l.layoutName} - {l.unitId || l.plotId}</td>
                      <td style={{color: 'var(--color-text-muted)'}}>{l.contactNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
