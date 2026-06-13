import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery, useDeleteLayoutMutation } from '../api/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function BuildingLayouts() {
  const { data: allLayouts = [], isLoading: loading, error } = useGetLayoutsQuery();
  const [deleteLayout] = useDeleteLayoutMutation();
  const navigate = useNavigate();

  const buildingLayouts = allLayouts.filter(l => l.layoutKind === 'building');

  if (loading) return <div className="app-loading">Loading Building Layouts...</div>;

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
    <h1 className="welcome-title">Building Layouts</h1>
    <p className="welcome-subtitle">
      Manage your buildings, floors, and apartment units.
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
      onClick={() => navigate('/create/building')}
    >
      + Create Building
    </button>

    <div className="welcome-stats">
      <div className="stat-badge">
        <span className="stat-value">{buildingLayouts.length}</span>
        <span className="stat-label">Buildings</span>
      </div>
    </div>
  </div>
</section>

      {error && <div className="dashboard-error">Error loading building layouts.</div>}

      {buildingLayouts.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-illustration">🏢</div>
          <h3>No Buildings Found</h3>
          <p>You haven't created any building layouts yet.</p>
          <div style={{marginTop: '1rem'}}>
            <button className="btn-primary" onClick={() => navigate('/create/building')}>Create Building</button>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {buildingLayouts.map((layout) => {
            const totalFloors = layout.floors?.length || 0;
            // Count configurations (unit types) across all floors
            const totalUnits = layout.floors?.reduce((acc, floor) => acc + (floor.configurations?.length || 0), 0) || 0;

            return (
              <div key={layout.id} className="project-card">
                <div className="project-card-image">
                  {layout.imagePath ? (
                    <img src={`${API_BASE}/uploads/${layout.imagePath}`} alt={layout.name} loading="lazy" />
                  ) : (
                    <div className="project-card-placeholder">No Image</div>
                  )}
                  <span className="project-badge" style={{background: 'var(--color-booked)'}}>Building</span>
                </div>
                <div className="project-card-content">
                  <h3 className="project-title">{layout.name}</h3>
                  <div className="project-meta">
                    <span className="project-meta-item">Floors: {totalFloors}</span>
                    <span className="project-meta-item">Units: {totalUnits}</span>
                  </div>
                  <div className="project-card-actions">
                    <button className="btn-primary" onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                      View
                    </button>
                    <button className="btn-secondary" onClick={() => navigate(`/layout/${layout.id}/edit/building`)}>
                      Edit
                    </button>
                    <button className="btn-secondary btn-danger" onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this building layout?')) {
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
