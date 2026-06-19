import React from 'react';

export function SkeletonLine({ width = '100%', height = '1rem', style = {} }) {
  return (
    <div
      className="skeleton-box"
      style={{
        width,
        height,
        ...style,
      }}
    />
  );
}

export function SkeletonBlock({ width = '100%', height = '100px', borderRadius = 'var(--radius-md)', style = {} }) {
  return (
    <div
      className="skeleton-box"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonDashboard() {
  return (
    <div className="dashboard-container" style={{ gap: '1.75rem' }}>
      {/* Banner Skeleton */}
      <div style={{
        padding: '1.5rem 2rem',
        background: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <SkeletonLine width="80px" height="0.8rem" />
        <SkeletonLine width="280px" height="1.8rem" />
        <SkeletonLine width="380px" height="1rem" />
      </div>

      {/* KPI Cards Grid */}
      <div className="premium-kpi-grid">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <SkeletonLine width="60%" height="0.85rem" />
            <SkeletonLine width="40%" height="1.8rem" />
            <SkeletonLine width="50%" height="0.8rem" />
          </div>
        ))}
      </div>

      {/* Recent Projects Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <SkeletonLine width="180px" height="1.5rem" />
        <SkeletonLine width="60px" height="1rem" />
      </div>

      {/* Projects Cards Grid */}
      <div className="projects-grid">
        {[1, 2].map(idx => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <SkeletonBlock height="180px" borderRadius="16px 16px 0 0" />
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <SkeletonLine width="70%" height="1.2rem" />
              <SkeletonLine width="40%" height="0.85rem" />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <SkeletonBlock height="2.2rem" style={{ flex: 1 }} />
                <SkeletonBlock height="2.2rem" style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonLayouts() {
  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonLine width="200px" height="2rem" />
          <SkeletonLine width="300px" height="0.9rem" />
        </div>
        <SkeletonBlock width="120px" height="2.85rem" />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <SkeletonBlock width="280px" height="2.5rem" />
        <SkeletonBlock width="150px" height="2.5rem" />
        <SkeletonBlock width="150px" height="2.5rem" />
      </div>

      <div className="projects-grid">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <SkeletonBlock height="160px" borderRadius="16px 16px 0 0" />
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <SkeletonLine width="75%" height="1.1rem" />
              <SkeletonLine width="45%" height="0.8rem" />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <SkeletonBlock height="2.2rem" style={{ flex: 1 }} />
                <SkeletonBlock height="2.2rem" style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonLeads() {
  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <SkeletonLine width="240px" height="2rem" />
        <SkeletonLine width="320px" height="0.9rem" />
      </div>

      <div className="premium-kpi-grid" style={{ marginBottom: '2rem' }}>
        {[1, 2, 3].map(idx => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <SkeletonLine width="60%" height="0.85rem" />
            <SkeletonLine width="45%" height="1.8rem" />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <SkeletonLine width="160px" height="1.2rem" style={{ marginBottom: '0.5rem' }} />
        {[1, 2, 3].map(idx => (
          <SkeletonBlock key={idx} height="60px" style={{ marginBottom: '0.5rem' }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonInsights() {
  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <SkeletonLine width="140px" height="2rem" />
        <SkeletonLine width="340px" height="0.9rem" />
      </div>

      <div className="premium-kpi-grid" style={{ marginBottom: '2rem' }}>
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <SkeletonLine width="65%" height="0.8rem" />
            <SkeletonLine width="50%" height="1.6rem" />
          </div>
        ))}
      </div>

      <SkeletonLine width="200px" height="1.2rem" style={{ marginBottom: '1rem' }} />
      <SkeletonBlock height="240px" />
    </div>
  );
}
