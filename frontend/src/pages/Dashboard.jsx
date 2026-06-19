import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGetLayoutsQuery, useGetAdminLeadsQuery, useDeleteLayoutMutation } from '../api/apiSlice';
import { normalizeDateValue } from '../utils/dateUtils';

import { SkeletonDashboard } from '../components/SkeletonLoaders';

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
    if (user?.role === 'super_admin') {
      navigate('/platform/dashboard', { replace: true });
    } else {
      refreshUser();
    }
  }, [user, navigate, refreshUser]);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="dashboard-container" style={{ gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <section className="welcome-banner" style={{ 
        marginBottom: '0', 
        padding: '1.25rem 2rem',
        background: 'rgba(255, 255, 255, 0.55)', 
        backdropFilter: 'blur(16px)', 
        border: '1px solid rgba(255, 255, 255, 0.6)', 
        boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)' 
      }}>
        <div className="welcome-content">
          <p className="section-kicker" style={{ color: '#0a8870', fontWeight: '700', margin: '0 0 0.25rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Builder Studio</p>
          <h1 className="welcome-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.75rem', margin: '0 0 0.25rem 0', color: '#0f172a' }}>Welcome back, {user?.name || user?.email?.split('@')[0]}</h1>
          <p className="welcome-subtitle" style={{ color: '#475569', fontWeight: '500', margin: 0, fontSize: '0.9rem' }}>Here's your real estate portfolio overview at a glance.</p>
        </div>
      </section>

      {/* KPI Stats (Admin Only) */}
      {isAdmin && (
        <section className="premium-kpi-grid" style={{ marginBottom: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div className="premium-stat-card" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 253, 252, 0.8) 100%)', 
            backdropFilter: 'blur(12px)', 
            border: '1px solid rgba(16, 185, 129, 0.12)',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.12)';
          }}
          >
            <div className="premium-stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              <span>Total Projects</span>
              <div style={{ color: '#0a8870', background: 'rgba(10, 136, 112, 0.08)', padding: '6px', borderRadius: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
              </div>
            </div>
            <div className="premium-stat-value" style={{ fontWeight: '800', fontSize: '2.25rem', color: '#0f172a', lineHeight: '1.1', marginBottom: '0.75rem' }}>{(layouts || []).length}</div>
            <div><span className="premium-stat-trend positive" style={{ fontWeight: '700', color: '#047857', background: '#D1FAE5', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Active</span></div>
          </div>
          <div className="premium-stat-card" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 253, 252, 0.8) 100%)', 
            backdropFilter: 'blur(12px)', 
            border: '1px solid rgba(16, 185, 129, 0.12)',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.12)';
          }}
          >
            <div className="premium-stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              <span>Plot Maps</span>
              <div style={{ color: '#0a8870', background: 'rgba(10, 136, 112, 0.08)', padding: '6px', borderRadius: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
            </div>
            <div className="premium-stat-value" style={{ fontWeight: '800', fontSize: '2.25rem', color: '#0f172a', lineHeight: '1.1', marginBottom: '0.75rem' }}>{(layouts || []).filter(l => l?.layoutKind !== 'building').length}</div>
            <div><span className="premium-stat-trend neutral" style={{ fontWeight: '700', color: '#475569', background: '#F1F5F9', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Lands</span></div>
          </div>
          <div className="premium-stat-card" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 253, 252, 0.8) 100%)', 
            backdropFilter: 'blur(12px)', 
            border: '1px solid rgba(16, 185, 129, 0.12)',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.12)';
          }}
          >
            <div className="premium-stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              <span>Buildings</span>
              <div style={{ color: '#0a8870', background: 'rgba(10, 136, 112, 0.08)', padding: '6px', borderRadius: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path></svg>
              </div>
            </div>
            <div className="premium-stat-value" style={{ fontWeight: '800', fontSize: '2.25rem', color: '#0f172a', lineHeight: '1.1', marginBottom: '0.75rem' }}>{(layouts || []).filter(l => l?.layoutKind === 'building').length}</div>
            <div><span className="premium-stat-trend neutral" style={{ fontWeight: '700', color: '#475569', background: '#F1F5F9', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem' }}>High-Rises</span></div>
          </div>
          <div className="premium-stat-card" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 253, 252, 0.8) 100%)', 
            backdropFilter: 'blur(12px)', 
            border: '1px solid rgba(16, 185, 129, 0.12)',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.01)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.12)';
          }}
          >
            <div className="premium-stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              <span>Total Leads</span>
              <div style={{ color: '#0a8870', background: 'rgba(10, 136, 112, 0.08)', padding: '6px', borderRadius: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              </div>
            </div>
            <div className="premium-stat-value" style={{ fontWeight: '800', fontSize: '2.25rem', color: '#0f172a', lineHeight: '1.1', marginBottom: '0.75rem' }}>{leadsData?.total || 0}</div>
            <div><span className="premium-stat-trend positive" style={{ fontWeight: '700', color: '#047857', background: '#D1FAE5', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Trending</span></div>
          </div>
        </section>
      )}

      {/* Quick Actions (Admin Only) */}
      {isAdmin && (
        <section className="quick-actions-bar" style={{ marginBottom: '0' }}>
          <button className="action-card" onClick={() => navigate('/create')}>
            <div className="action-card-icon">🗺️</div>
            <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>New Plot Map</div>
          </button>
          <button className="action-card" onClick={() => navigate('/create/building')}>
            <div className="action-card-icon">🏢</div>
            <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>New Building</div>
          </button>
          <button className="action-card" onClick={() => navigate('/admin/leads')}>
            <div className="action-card-icon">👥</div>
            <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>View Leads</div>
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
              
              const totalPlots = layout.totalPlots ?? plots.length;
              const availablePlots = layout.availablePlots ?? plots.filter(p => p.status?.toLowerCase() === "available").length;
              const soldPlots = layout.soldPlots ?? plots.filter(p => p.status?.toLowerCase() === "sold").length;

              return (
              <div key={layout.id} className="project-card-premium" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 253, 252, 0.8) 100%)', 
                backdropFilter: 'blur(16px)', 
                border: '1px solid rgba(16, 185, 129, 0.14)',
                boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.14)';
              }}
              >
                <div className="project-card-img-wrap" style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  {layout.imagePath ? (
                    <img src={`${API_BASE}/uploads/${layout.imagePath}`} alt={layout.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}>No Image</div>
                  )}
                </div>
                <div className="project-card-body" style={{ padding: '1.25rem 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="project-card-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: '#0f172a' }}>{layout.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#0a8870', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {layout.layoutKind === 'building' ? 'Building Layout' : 'Plot Layout'}
                    </p>
                  </div>
                  
                  <div className="project-card-metrics" style={{
                    display: 'flex',
                    gap: '1.5rem',
                    background: 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div className="project-card-metric" style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span className="project-card-metric-label" style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em' }}>Total Units</span>
                      <span className="project-card-metric-value" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>{totalPlots}</span>
                    </div>
                    <div className="project-card-metric" style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span className="project-card-metric-label" style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em' }}>Available</span>
                      <span className="project-card-metric-value" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10B981' }}>{availablePlots}</span>
                    </div>
                  </div>

                  <div className="project-card-actions-row" style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
                    <button className="btn-secondary" style={{ flex: 1, height: '2.5rem', padding: '0 1rem', fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                      View Public
                    </button>
                    {isAdmin && (
                      <button className="btn-primary" style={{ flex: 1, height: '2.5rem', padding: '0 1rem', fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} onClick={() => navigate(layout.layoutKind === 'building' ? `/layout/${layout.id}/edit/building` : `/layout/${layout.id}/edit`)}>
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
            <div className="admin-table-wrap" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>Tracking ID</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>Name</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>Project</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>Status</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(leadsData?.leads || []).slice(0, 5).map(l => {
                    const lStatus = (l.status || 'new').toLowerCase();
                    let inquiryType = 'Booking';
                    try {
                      if (l.metadata) {
                        const meta = JSON.parse(l.metadata);
                        if (meta && meta.inquiryType) {
                          inquiryType = meta.inquiryType;
                        }
                      }
                    } catch (e) {
                      // Ignore
                    }

                    return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="admin-cell-mono" style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', fontWeight: '600', color: '#1e293b' }}>{l.trackingId || `PV-${l.id.toString().padStart(4, '0')}`}</td>
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{l.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{l.contactNumber}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 500, color: '#334155' }}>{l.layoutName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Unit/Plot {l.unitId || l.plotId}</span>
                          {inquiryType.toLowerCase().includes('visit') ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe'
                            }}>
                              📅 site visit
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0'
                            }}>
                              ⚡ booking
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <span className={`badge-status ${lStatus}`} style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: lStatus === 'new' ? '#eff6ff' : '#f1f5f9',
                          color: lStatus === 'new' ? '#1d4ed8' : '#475569',
                          border: lStatus === 'new' ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                        }}>
                          {lStatus.charAt(0).toUpperCase() + lStatus.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', color: 'var(--color-text-muted)' }}>{formatDate(l.createdAt)}</td>
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
