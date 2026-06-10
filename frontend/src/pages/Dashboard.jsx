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
      <section className="dashboard-intro">
        <h1>Welcome back, {user?.name || user?.email?.split('@')[0]}</h1>
        <p>Here's your real estate portfolio overview at a glance.</p>
      </section>

      {/* KPI Stats (Admin Only) */}
      {isAdmin && (
        <section className="premium-kpi-grid">
          <div className="premium-stat-card">
            <div className="premium-stat-header">
              <span>Total Projects</span>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            </div>
            <div className="premium-stat-value">{(layouts || []).length}</div>
            <div><span className="premium-stat-trend positive">↑ Active</span></div>
          </div>
          <div className="premium-stat-card">
            <div className="premium-stat-header">
              <span>Plot Maps</span>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div className="premium-stat-value">{(layouts || []).filter(l => l?.layoutKind !== 'building').length}</div>
            <div><span className="premium-stat-trend neutral">Lands</span></div>
          </div>
          <div className="premium-stat-card">
            <div className="premium-stat-header">
              <span>Buildings</span>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
            </div>
            <div className="premium-stat-value">{(layouts || []).filter(l => l?.layoutKind === 'building').length}</div>
            <div><span className="premium-stat-trend neutral">High-Rises</span></div>
          </div>
          <div className="premium-stat-card">
            <div className="premium-stat-header">
              <span>Total Leads</span>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div className="premium-stat-value">{leadsData?.total || 0}</div>
            <div><span className="premium-stat-trend positive">↑ Trending</span></div>
          </div>
        </section>
      )}

      {/* Quick Actions (Admin Only) */}
      {isAdmin && (
        <section className="quick-actions-bar">
          <button className="action-card" onClick={() => navigate('/create')}>
            <div className="action-card-icon">🗺️</div>
            <div>New Plot Map</div>
          </button>
          <button className="action-card" onClick={() => navigate('/create/building')}>
            <div className="action-card-icon">🏢</div>
            <div>New Building</div>
          </button>
          <button className="action-card" onClick={() => navigate('/admin/leads')}>
            <div className="action-card-icon">👥</div>
            <div>View Leads</div>
          </button>
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
              <div key={layout.id} className="project-card-premium">
                <div className="project-card-img-wrap">
                  {layout.imagePath ? (
                    <img src={`${API_BASE}/uploads/${layout.imagePath}`} alt={layout.name} loading="lazy" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>No Image</div>
                  )}
                  <span className={`project-card-status ${layout.status === 'published' ? 'published' : 'draft'}`}>{layout.status === 'published' ? 'Published' : 'Draft'}</span>
                </div>
                <div className="project-card-body">
                  <div className="project-card-header">
                    <h3>{layout.name}</h3>
                    <p>{layout.layoutKind === 'building' ? 'Building Layout' : 'Plot Layout'}</p>
                  </div>
                  <div className="project-card-metrics">
                    <div className="project-card-metric">
                      <span className="project-card-metric-label">Total Units</span>
                      <span className="project-card-metric-value">{totalPlots}</span>
                    </div>
                    <div className="project-card-metric">
                      <span className="project-card-metric-label">Available</span>
                      <span className="project-card-metric-value" style={{color: 'var(--color-available)'}}>{availablePlots}</span>
                    </div>
                  </div>
                  <div className="project-card-actions-row">
                    <button className="btn-secondary" style={{flex: 1}} onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                      View Public
                    </button>
                    {isAdmin && (
                      <button className="btn-primary" style={{flex: 1}} onClick={() => navigate(layout.layoutKind === 'building' ? `/layout/${layout.id}/edit/building` : `/layout/${layout.id}/edit`)}>
                        Edit
                      </button>
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
            <div className="admin-table-wrap" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{background: 'var(--color-bg-wash)', textAlign: 'left'}}>
                    <th style={{ padding: '1rem' }}>Tracking ID</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Project</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(leadsData?.leads || []).slice(0, 5).map(l => {
                    const lStatus = (l.status || 'new').toLowerCase();
                    return (
                    <tr key={l.id}>
                      <td className="admin-cell-mono">{l.trackingId || `PV-${l.id.toString().padStart(4, '0')}`}</td>
                      <td>
                        <div style={{fontWeight: 600}}>{l.customerName}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>{l.contactNumber}</div>
                      </td>
                      <td>
                        <div>{l.layoutName}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>Unit/Plot {l.unitId || l.plotId}</div>
                      </td>
                      <td>
                        <span className={`badge-status ${lStatus}`}>
                          {lStatus.charAt(0).toUpperCase() + lStatus.slice(1)}
                        </span>
                      </td>
                      <td style={{color: 'var(--color-text-muted)'}}>{formatDate(l.createdAt)}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
