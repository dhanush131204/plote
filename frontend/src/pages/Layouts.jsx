import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery, useDeleteLayoutMutation, useUpdateLayoutMutation } from '../api/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Layouts() {
  const { data: layouts = [], isLoading: loading, error } = useGetLayoutsQuery();
  const [deleteLayout] = useDeleteLayoutMutation();
  const [updateLayout] = useUpdateLayoutMutation();
  const navigate = useNavigate();

  if (loading) return <div className="app-loading">Loading Projects...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem'}}>My Projects</h1>
          <p style={{color: 'var(--color-text-muted)'}}>Manage all your plot maps and building layouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/create/building')}>+ New Building</button>
          <button className="btn-primary" onClick={() => navigate('/create')}>+ New Plot Map</button>
        </div>
      </div>

      {error && <div className="dashboard-error">Error loading layouts.</div>}

      {layouts.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-illustration">🗺️</div>
          <h3>No Projects Found</h3>
          <p>You haven't created any layouts yet. Get started by creating your first project.</p>
          <div style={{marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
            <button className="btn-primary" onClick={() => navigate('/create')}>Create Plot Map</button>
            <button className="btn-secondary" onClick={() => navigate('/create/building')}>Create Building</button>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {layouts.map((layout) => {
            const isBuilding = layout.layoutKind === 'building';
            const plots = layout.plots || [];
            
            // Calculate statistics dynamically
            const totalPlots = layout.totalPlots ?? plots.length;
            const availablePlots = layout.availablePlots ?? plots.filter(p => p.status?.toLowerCase() === "available").length;

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
                    <span className="project-card-kind-badge">{isBuilding ? 'Building' : 'Plot Map'}</span>
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
                  <div className="project-card-actions-bar">
                    <button 
                      className="pca-btn pca-btn--edit" 
                      onClick={() => navigate(isBuilding ? `/layout/${layout.id}/edit/building` : `/layout/${layout.id}/edit`)}
                      title="Edit project"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button 
                      className="pca-btn" 
                      onClick={() => window.open(`/v/${layout.slug}`, '_blank')}
                      title="View public page"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      View
                    </button>
                    <button 
                      className={`pca-btn ${layout.status === 'published' ? 'pca-btn--unpublish' : 'pca-btn--publish'}`}
                      onClick={async () => {
                        try {
                          await updateLayout({ id: layout.id, status: layout.status === 'published' ? 'draft' : 'published' }).unwrap();
                        } catch (err) {
                          alert('Failed to update status');
                        }
                      }}
                      title={layout.status === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {layout.status === 'published' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                      {layout.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      className="pca-btn pca-btn--danger" 
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this layout?')) {
                          await deleteLayout(layout.id);
                        }
                      }}
                      title="Delete project"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
