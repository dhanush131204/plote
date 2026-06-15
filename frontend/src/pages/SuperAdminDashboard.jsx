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
    <div className="dashboard-container" style={{ padding: '1.5rem 2rem' }}>
      <section className="welcome-banner" style={{ 
        marginBottom: '1.25rem', 
        background: 'rgba(255, 255, 255, 0.55)', 
        backdropFilter: 'blur(16px)', 
        border: '1px solid rgba(255, 255, 255, 0.6)', 
        boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)' 
      }}>
        <div className="welcome-content">
          <p className="section-kicker" style={{ color: '#0a8870', fontWeight: '700' }}>Platform Overview</p>
          <h1 className="welcome-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Super Admin Dashboard</h1>
          <p className="welcome-subtitle">Global performance and platform usage statistics.</p>
        </div>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          
          <div className="stat-card" style={{ 
            background: 'rgba(255, 255, 255, 0.65)', 
            backdropFilter: 'blur(12px)',
            padding: '1.25rem', 
            borderRadius: '16px', 
            boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.7)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            transition: 'transform 0.2s ease'
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Builders</span>
            <span style={{ fontSize: '2.75rem', fontWeight: '800', color: '#0a8870' }}>{analytics?.totalAdmins || 0}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Registered Accounts</div>
          </div>

          <div className="stat-card" style={{ 
            background: 'rgba(255, 255, 255, 0.65)', 
            backdropFilter: 'blur(12px)',
            padding: '1.25rem', 
            borderRadius: '16px', 
            boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.7)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            transition: 'transform 0.2s ease'
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Builders</span>
            <span style={{ fontSize: '2.75rem', fontWeight: '800', color: '#16a34a' }}>{analytics?.activeAdmins || 0}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Enabled Accounts</div>
          </div>

          <div className="stat-card" style={{ 
            background: 'rgba(255, 255, 255, 0.65)', 
            backdropFilter: 'blur(12px)',
            padding: '1.25rem', 
            borderRadius: '16px', 
            boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.7)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            transition: 'transform 0.2s ease'
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inactive Builders</span>
            <span style={{ fontSize: '2.75rem', fontWeight: '800', color: '#ea580c' }}>{analytics?.disabledAdmins || 0}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Disabled Accounts</div>
          </div>



        </div>
      </section>

      <section className="quick-actions-section">
        <h2 className="section-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Platform Actions</h2>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate('/platform/admins')} style={{ 
            background: 'rgba(255, 255, 255, 0.65)', 
            backdropFilter: 'blur(12px)', 
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)',
            borderRadius: '16px'
          }}>
            <div className="action-icon" style={{ background: '#e0f2fe', borderRadius: '12px' }}>👥</div>
            <div className="action-text">
              <h3 style={{ fontWeight: 700 }}>Manage Builders</h3>
              <p>Add, disable, or configure builder accounts</p>
            </div>
          </button>
          <button className="action-card" onClick={() => navigate('/platform/projects')} style={{ 
            background: 'rgba(255, 255, 255, 0.65)', 
            backdropFilter: 'blur(12px)', 
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)',
            borderRadius: '16px'
          }}>
            <div className="action-icon" style={{ background: '#ecfdf5', borderRadius: '12px' }}>🗺️</div>
            <div className="action-text">
              <h3 style={{ fontWeight: 700 }}>Global Projects</h3>
              <p>View all projects created across the platform</p>
            </div>
          </button>
        </div>
      </section>

    </div>
  );
}
