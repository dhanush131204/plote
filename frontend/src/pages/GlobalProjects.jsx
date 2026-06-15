import { useState, useEffect } from 'react';
import { useGetLayoutsQuery, useDeleteLayoutMutation } from '../api/apiSlice';
import { useNavigate } from 'react-router-dom';
import { normalizeDateValue } from '../utils/dateUtils';

export default function GlobalProjects() {
  const { data: layouts, isLoading } = useGetLayoutsQuery();
  const [deleteLayout] = useDeleteLayoutMutation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const itemsPerPage = 10;

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

  const formatDate = (value) => {
    const normalized = normalizeDateValue(value);
    if (!normalized) return '—';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '—';
    return date.toLocaleDateString();
  };

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  if (isLoading) return <div className="app-loading">Loading Global Projects...</div>;

  const filteredLayouts = (layouts || []).filter(layout => {
    const company = (layout.companyName || layout.builderName || 'Not Set').toLowerCase();
    const name = (layout.name || '').toLowerCase();
    const matchesSearch = company.includes(search.toLowerCase()) || name.includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'All' || 
      (typeFilter === 'building' && layout.layoutKind === 'building') ||
      (typeFilter === 'plot' && layout.layoutKind !== 'building');

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredLayouts.length / itemsPerPage) || 1;
  const paginatedLayouts = filteredLayouts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title & Intro with extra bottom margin */}
      <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="welcome-title" style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#0f172a' }}>Global Projects</h1>
          <p className="welcome-subtitle" style={{ fontSize: '1rem', marginTop: '0.5rem', color: '#64748b' }}>All plot maps and buildings across all registered builders on the platform.</p>
        </div>
        
        {/* Spacious Search & Filter Controls */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* Always visible Search Input Box */}
          <div style={{ width: '320px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem 0.75rem 2.5rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                outline: 'none',
                background: '#fff',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: '160px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                outline: 'none',
                background: '#fff',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <option value="All">All Types</option>
              <option value="plot">Plot Maps</option>
              <option value="building">Buildings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spacious, Center-Aligned Table */}
      <div className="admin-table-wrap" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', border: '1px solid var(--color-border)', background: '#fff' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Company Name</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Project Name</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Type</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Created Date</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLayouts.map(layout => (
              <tr key={layout.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '1.5rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>{layout.companyName || layout.builderName || 'Not Set'}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>{layout.name}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center', color: '#334155' }}>
                  <span style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: layout.layoutKind === 'building' ? '#eff6ff' : '#ecfdf5',
                    color: layout.layoutKind === 'building' ? '#1d4ed8' : '#047857',
                    border: layout.layoutKind === 'building' ? '1px solid #bfdbfe' : '1px solid #a7f3d0'
                  }}>
                    {layout.layoutKind === 'building' ? 'Building' : 'Plot Map'}
                  </span>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'center', color: '#475569' }}>{formatDate(layout.createdAt)}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <span className="status-available" style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>Active</span>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      onClick={() => window.open(`/v/${layout.slug}`, '_blank')}
                      style={{
                        padding: '0.6rem 1.25rem',
                        background: '#0a8870',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        boxShadow: '0 2px 4px rgba(10, 136, 112, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#086e5b';
                        e.target.style.boxShadow = '0 4px 8px rgba(10, 136, 112, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#0a8870';
                        e.target.style.boxShadow = '0 2px 4px rgba(10, 136, 112, 0.15)';
                      }}
                    >
                      View Public
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedLayouts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)', fontSize: '1rem' }}>No projects found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spacious Pagination Footer */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2.5rem',
          padding: '1.25rem 2rem',
          background: 'var(--color-surface)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Showing page <strong style={{ color: '#0f172a' }}>{currentPage}</strong> of <strong style={{ color: '#0f172a' }}>{totalPages}</strong> ({filteredLayouts.length} total projects)
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-secondary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-secondary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
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
