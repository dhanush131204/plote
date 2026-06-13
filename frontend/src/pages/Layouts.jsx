import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery, useDeleteLayoutMutation, useUpdateLayoutMutation } from '../api/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Layouts() {
  const { data: layouts = [], isLoading: loading, error } = useGetLayoutsQuery();
  const [deleteLayout] = useDeleteLayoutMutation();
  const [updateLayout] = useUpdateLayoutMutation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const itemsPerPage = 8;

  const handleDelete = (id, name) => {
    setConfirmDialog({
      title: 'Delete Project',
      message: `Are you sure you want to delete the project "${name}"? This action cannot be undone.`,
      actionLabel: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteLayout(id).unwrap();
        } catch (err) {
          alert(err.data?.error || 'Failed to delete project');
        }
        setConfirmDialog(null);
      }
    });
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter]);

  if (loading) return <div className="app-loading">Loading Projects...</div>;

  const filteredLayouts = layouts.filter(layout => {
    const nameMatches = (layout.name || '').toLowerCase().includes(search.toLowerCase());
    
    const typeMatches = typeFilter === 'All' || 
      (typeFilter === 'building' && layout.layoutKind === 'building') ||
      (typeFilter === 'plot' && layout.layoutKind !== 'building');

    const statusMatches = statusFilter === 'All' || 
      (layout.status || 'draft') === statusFilter;

    return nameMatches && typeMatches && statusMatches;
  });

  const totalPages = Math.ceil(filteredLayouts.length / itemsPerPage) || 1;
  const paginatedLayouts = filteredLayouts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="dashboard-container">
      <div className="dashboard-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem'}}>My Projects</h1>
          <p style={{color: 'var(--color-text-muted)'}}>Manage all your plot maps and building layouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filter & Search Toolbar inline */}
          {layouts.length > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  flexShrink: 0
                }}
                title="Toggle Search"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>

              {/* Type Filter */}
              <div style={{ minWidth: '130px' }}>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--color-text)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="All">All Types</option>
                  <option value="plot">Plot Maps</option>
                  <option value="building">Buildings</option>
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: '130px' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--color-text)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Search Input Box */}
              {isSearchExpanded && (
                <div style={{ width: '220px', display: 'flex', alignItems: 'center', animation: 'fadeInWidth 0.25s ease-out' }}>
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      background: '#fff',
                      color: 'var(--color-text)',
                      fontSize: '0.9rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <button className="btn-secondary" style={{ height: '2.5rem', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/create/building')}>+ New Building</button>
          <button className="btn-primary" style={{ height: '2.5rem', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/create')}>+ New Plot Map</button>
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
      ) : filteredLayouts.length === 0 ? (
        <div className="empty-state-premium" style={{ minHeight: '240px' }}>
          <h3>No matching projects found</h3>
          <p>Try adjusting your search criteria or filter choices.</p>
        </div>
      ) : (
        <>
          <div className="projects-grid">
            {paginatedLayouts.map((layout) => {
              const isBuilding = layout.layoutKind === 'building';
              const plots = layout.plots || [];
              
              // Calculate statistics dynamically
              // For buildings: count configurations across all floors
              // For plots: count plots as before
              const totalPlots = isBuilding
                ? (layout.floors || []).reduce((acc, f) => acc + (f.configurations?.length || 0), 0)
                : (layout.totalPlots ?? plots.length);
              const availablePlots = isBuilding
                ? (layout.floors || []).reduce((acc, f) => acc + (f.configurations?.length || 0), 0)
                : (layout.availablePlots ?? plots.filter(p => p.status?.toLowerCase() === "available").length);

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
                        onClick={() => handleDelete(layout.id, layout.name)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2.5rem',
              padding: '1.25rem',
              background: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredLayouts.length} total projects)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {confirmDialog && (
        <div className="plot-interest-modal-root" role="dialog" aria-modal="true" style={{ zIndex: 1100 }}>
          <div className="plot-interest-modal-backdrop" onClick={() => setConfirmDialog(null)} style={{ backdropFilter: 'blur(4px)' }} />
          <div className="plot-interest-modal" style={{ maxWidth: '420px', width: '90%', borderRadius: '16px', overflow: 'hidden', padding: '2rem' }}>
            <div className="plot-interest-modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
              <h2 className="plot-interest-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>{confirmDialog.title}</h2>
              <button className="plot-interest-modal-close" onClick={() => setConfirmDialog(null)}>×</button>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.5', margin: '0.5rem 0 1.5rem 0' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px' }}>
                Cancel
              </button>
              <button 
                className={confirmDialog.isDanger ? 'btn-danger' : 'btn-primary'} 
                onClick={confirmDialog.onConfirm} 
                style={{ 
                  padding: '0.6rem 1.25rem', 
                  borderRadius: '8px',
                  background: confirmDialog.isDanger ? '#ef4444' : '#0a8870',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
