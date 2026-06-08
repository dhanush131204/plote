import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery, useDeleteLayoutMutation } from '../api/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Layouts() {
  const { data: layouts = [], isLoading: loading, error } = useGetLayoutsQuery();
  const [deleteLayout] = useDeleteLayoutMutation();
  const navigate = useNavigate();

  if (loading) return <div className="app-loading">Loading Layouts...</div>;

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{marginBottom: '2rem'}}>
        <div className="welcome-content">
          <h1 className="welcome-title">All Layouts</h1>
          <p className="welcome-subtitle">Manage all your plot maps and building layouts.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{layouts.length}</span>
            <span className="stat-label">Total Layouts</span>
          </div>
        </div>
      </section>

      {error && <div className="dashboard-error">Error loading layouts.</div>}

      {layouts.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-illustration">🗺️</div>
          <h3>No Layouts Found</h3>
          <p>You haven't created any layouts yet. Get started by creating your first project.</p>
          <div style={{marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
            <button className="btn-primary" onClick={() => navigate('/create')}>Create Plot Map</button>
            <button className="btn-secondary" onClick={() => navigate('/create/building')}>Create Building</button>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {layouts.map((layout) => {
            const isBuilding = layout.layoutKind === 'building';
            return (
              <div key={layout.id} className="project-card">
                <div className="project-card-image">
                  {layout.imagePath ? (
                    <img src={`${API_BASE}/uploads/${layout.imagePath}`} alt={layout.name} loading="lazy" />
                  ) : (
                    <div className="project-card-placeholder">No Image</div>
                  )}
                  <span className="project-badge">{isBuilding ? 'Building' : 'Plot Map'}</span>
                </div>
                <div className="project-card-content">
                  <h3 className="project-title">{layout.name}</h3>
                  <div className="project-meta">
                    <span className="project-meta-item">📍 {layout.location || 'Location not set'}</span>
                    <span className="project-meta-item">📏 {layout.plots?.length || layout.floors?.length || 0} {isBuilding ? 'Floors' : 'Plots'}</span>
                  </div>
                  <div className="project-card-actions">
                    <button className="btn-primary" onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                      View
                    </button>
                    <button className="btn-secondary" onClick={() => navigate(isBuilding ? `/layout/${layout.id}/edit/building` : `/layout/${layout.id}/edit`)}>
                      Edit
                    </button>
                    <button className="btn-secondary btn-danger" onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this layout?')) {
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
