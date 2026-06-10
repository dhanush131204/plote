import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGetPlatformAnalyticsQuery } from '../api/apiSlice';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: analytics, isLoading, error } = useGetPlatformAnalyticsQuery();

  if (isLoading) return <div className="app-loading">Loading Platform Analytics...</div>;

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          {error?.data?.error || 'Failed to load analytics.'}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <p className="section-kicker">Platform Overview</p>
          <h1 className="welcome-title">Super Admin Dashboard</h1>
          <p className="welcome-subtitle">Global performance and platform usage statistics.</p>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          
          <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Builders</span>
            <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>{analytics?.totalAdmins || 0}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Registered Accounts</div>
          </div>

          <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Builders</span>
            <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-success)' }}>{analytics?.activeAdmins || 0}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Enabled Accounts</div>
          </div>

          <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disabled Builders</span>
            <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>{analytics?.disabledAdmins || 0}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Suspended Accounts</div>
          </div>

          <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Projects</span>
            <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-text)' }}>{analytics?.totalProjects || 0}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>Across all builders</div>
          </div>

        </div>
      </section>

      <section className="quick-actions-section">
        <h2 className="section-title">Platform Actions</h2>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate('/platform/admins')}>
            <div className="action-icon">👥</div>
            <div className="action-text">
              <h3>Manage Builders</h3>
              <p>Add, disable, or configure builder accounts</p>
            </div>
          </button>
          <button className="action-card" onClick={() => navigate('/platform/projects')}>
            <div className="action-icon">🗺️</div>
            <div className="action-text">
              <h3>Global Projects</h3>
              <p>View all projects created across the platform</p>
            </div>
          </button>
        </div>
      </section>

    </div>
  );
}
