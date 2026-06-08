import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery, useDeleteLayoutMutation } from '../api/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function PlotMaps() {
  const { data: allLayouts = [], isLoading: loading, error } = useGetLayoutsQuery();
  const [deleteLayout] = useDeleteLayoutMutation();
  const navigate = useNavigate();

  const plotMaps = allLayouts.filter(l => l.layoutKind !== 'building');

  if (loading) return <div className="app-loading">Loading Plot Maps...</div>;

  return (
    <div className="dashboard-container">
      <section
  className="welcome-banner"
  style={{
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  }}
>
  <div className="welcome-content">
    <h1 className="welcome-title">Plot Maps</h1>
    <p className="welcome-subtitle">
      Manage your 2D plot maps and availability.
    </p>
  </div>

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}
  >
    <button
      className="btn-primary"
      onClick={() => navigate('/create')}
    >
      + Create Plot Map
    </button>

    <div className="welcome-stats">
      <div className="stat-badge">
        <span className="stat-value">{plotMaps.length}</span>
        <span className="stat-label">Plot Maps</span>
      </div>
    </div>
  </div>
</section>

      {error && <div className="dashboard-error">Error loading plot maps.</div>}

      {plotMaps.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-illustration">🗺️</div>
          <h3>No Plot Maps Found</h3>
          <p>You haven't created any plot maps yet.</p>
          <div style={{marginTop: '1rem'}}>
            <button className="btn-primary" onClick={() => navigate('/create')}>Create Plot Map</button>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {plotMaps.map((layout) => {
            const totalPlots = layout.plots?.length || 0;
            const availablePlots = layout.plots?.filter(p => p.status === 'Available').length || 0;
            const soldPlots = layout.plots?.filter(p => p.status === 'Sold').length || 0;

            return (
              <div key={layout.id} className="project-card">
                <div className="project-card-image">
                  {layout.imagePath ? (
                    <img src={`${API_BASE}/uploads/${layout.imagePath}`} alt={layout.name} loading="lazy" />
                  ) : (
                    <div className="project-card-placeholder">No Image</div>
                  )}
                  <span className="project-badge" style={{background: 'var(--color-accent)'}}>Plot Map</span>
                </div>
                <div className="project-card-content">
                  <h3 className="project-title">{layout.name}</h3>
                  <div className="project-meta">
                    <span className="project-meta-item">Total: {totalPlots}</span>
                    <span className="project-meta-item" style={{color: 'var(--color-available)'}}>Available: {availablePlots}</span>
                    <span className="project-meta-item" style={{color: 'var(--color-sold)'}}>Sold: {soldPlots}</span>
                  </div>
                  <div className="project-card-actions">
                    <button className="btn-primary" onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                      View
                    </button>
                    <button className="btn-secondary" onClick={() => navigate(`/layout/${layout.id}/edit`)}>
                      Edit
                    </button>
                    <button className="btn-secondary btn-danger" onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this plot map?')) {
                        await deleteLayout(layout.id);
                      }
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
