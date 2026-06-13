import { useState, useEffect } from 'react';
import { useGetAdminUsersQuery, useUpdateAdminUserMutation, useCreateAdminUserMutation, useDeleteAdminUserMutation } from '../api/apiSlice';

export default function ManageAdmins() {
  const { data: users, isLoading } = useGetAdminUsersQuery();
  const [updateUser] = useUpdateAdminUserMutation();
  const [createUser] = useCreateAdminUserMutation();
  const [deleteUser] = useDeleteAdminUserMutation();
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', companyName: '' });
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleImpersonate = (user) => {
    if (user.role === 'super_admin') {
      alert("Cannot impersonate a super admin.");
      return;
    }
    localStorage.setItem('impersonateUserId', user.id);
    window.location.href = '/dashboard';
  };

  const handleToggleStatus = (user) => {
    if (user.role === 'super_admin') {
      alert("Cannot disable a super admin directly.");
      return;
    }
    const newStatus = user.status === 'disabled' ? 'active' : 'disabled';
    setConfirmDialog({
      title: `${newStatus === 'active' ? 'Enable' : 'Disable'} Account`,
      message: `Are you sure you want to ${newStatus} the account for ${user.companyName || user.email}?`,
      actionLabel: newStatus === 'active' ? 'Enable' : 'Disable',
      isDanger: newStatus !== 'active',
      onConfirm: async () => {
        try {
          await updateUser({ id: user.id, status: newStatus }).unwrap();
          if (selectedBuilder && selectedBuilder.id === user.id) {
            setSelectedBuilder({ ...selectedBuilder, status: newStatus });
          }
        } catch (err) {
          alert("Failed to update status.");
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleDelete = (user) => {
    if (user.role === 'super_admin') {
      alert("Cannot delete a super admin.");
      return;
    }
    setConfirmDialog({
      title: 'Delete Builder Account',
      message: `Are you absolutely sure you want to DELETE the account for ${user.companyName || user.email}? This action cannot be undone.`,
      actionLabel: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteUser(user.id).unwrap();
          if (selectedBuilder && selectedBuilder.id === user.id) {
            setSelectedBuilder(null);
          }
        } catch (err) {
          alert(err?.data?.error || "Failed to delete user.");
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUser({ ...formData, role: 'admin' }).unwrap();
      setModalOpen(false);
      setFormData({ email: '', password: '', companyName: '' });
    } catch (err) {
      setError(err?.data?.error || 'Failed to create builder account.');
    }
  };

  if (isLoading) return <div className="app-loading">Loading Builders...</div>;

  const builders = (users || []).filter(u => u.role === 'admin');

  const filteredBuilders = builders.filter(u => {
    const name = (u.name || '').toLowerCase();
    const company = (u.companyName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || company.includes(q) || email.includes(q);
  });

  const totalPages = Math.ceil(filteredBuilders.length / itemsPerPage) || 1;
  const paginatedBuilders = filteredBuilders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="welcome-title" style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#0f172a' }}>Manage Builders</h1>
          <p className="welcome-subtitle" style={{ fontSize: '1rem', marginTop: '0.5rem', color: '#64748b' }}>Configure, disable, and monitor builder accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Toggleable Search Bar */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              style={{
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                width: '2.75rem',
                height: '2.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                outline: 'none',
                flexShrink: 0
              }}
              title="Toggle Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>

            {/* Search Input Box */}
            {isSearchExpanded && (
              <div style={{ width: '320px', display: 'flex', alignItems: 'center', animation: 'fadeInWidth 0.25s ease-out' }}>
                <input
                  type="text"
                  placeholder="Search builders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--color-text)',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                  }}
                />
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={() => setModalOpen(true)}
            style={{ padding: '1rem 2rem', borderRadius: '10px', fontWeight: '700', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(10, 136, 112, 0.2)', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            + Add Builder
          </button>
        </div>
      </div>

      <div className="admin-table-wrap" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', border: '1px solid var(--color-border)', background: '#fff' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Builder Name</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Company Name</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Email</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Phone Number</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBuilders.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '1.5rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>{u.name || 'Not Set'}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>{u.companyName || 'Not Set'}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center', color: '#475569' }}>{u.email}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center', color: '#475569' }}>{u.phone || 'Not Set'}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', gap: '0.50rem', justifyContent: 'center', alignItems: 'center' }}>
                    <button 
                      className="btn-secondary"
                      onClick={() => setSelectedBuilder(u)}
                      style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                    >
                      View Profile
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => handleImpersonate(u)}
                      style={{ 
                        padding: '0.55rem 1rem', 
                        fontSize: '0.85rem', 
                        borderRadius: '8px', 
                        background: '#6366f1', 
                        color: '#fff', 
                        border: '1px solid #4f46e5' 
                      }}
                    >
                      View Dashboard
                    </button>
                    <button 
                      className={u.status === 'disabled' ? 'btn-secondary' : 'btn-danger'} 
                      onClick={() => handleToggleStatus(u)}
                      style={{
                        padding: '0.55rem 1rem', 
                        fontSize: '0.85rem', 
                        borderRadius: '8px', 
                        background: u.status === 'disabled' ? '#f1f5f9' : '#fff7ed', 
                        color: u.status === 'disabled' ? '#475569' : '#ea580c', 
                        border: u.status === 'disabled' ? '1px solid #cbd5e1' : '1px solid #fed7aa'
                      }}
                    >
                      {u.status === 'disabled' ? 'Enable' : 'Disable'}
                    </button>
                    <button 
                      className="btn-danger" 
                      onClick={() => handleDelete(u)}
                      style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedBuilders.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>No builders found.</td>
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
            Showing page <strong style={{ color: '#0f172a' }}>{currentPage}</strong> of <strong style={{ color: '#0f172a' }}>{totalPages}</strong> ({filteredBuilders.length} total builders)
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

      {isModalOpen && (
        <div className="plot-interest-modal-root" style={{ zIndex: 1000 }}>
          <div className="plot-interest-modal-backdrop" onClick={() => setModalOpen(false)} style={{ backdropFilter: 'blur(4px)' }} />
          <div className="plot-interest-modal" style={{ borderRadius: '16px', overflow: 'hidden', padding: '2rem' }}>
            <div className="plot-interest-modal-header" style={{ borderBottom: 'none' }}>
              <h2 className="plot-interest-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>Create Builder Account</h2>
              <button className="plot-interest-modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form className="plot-interest-modal-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              {error && <div className="panel-inline-error">{error}</div>}
              <label className="plot-interest-label">
                <span className="sr-only">Builder Name</span>
                <input type="text" placeholder="Builder Name" required className="panel-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={{ borderRadius: '8px' }} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Company Name</span>
                <input type="text" placeholder="Company Name" required className="panel-input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} style={{ borderRadius: '8px' }} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Login Email</span>
                <input type="email" placeholder="Login Email" required className="panel-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ borderRadius: '8px' }} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Phone Number</span>
                <input type="tel" placeholder="Phone Number" required className="panel-input" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ borderRadius: '8px' }} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Temporary Password</span>
                <input type="password" placeholder="Temporary Password" required className="panel-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ borderRadius: '8px' }} />
              </label>
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '10px' }}>Create Account</button>
            </form>
          </div>
        </div>
      )}

      {selectedBuilder && (
        <div className="plot-interest-modal-root" role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
          <div className="plot-interest-modal-backdrop" onClick={() => setSelectedBuilder(null)} style={{ backdropFilter: 'blur(4px)' }} />
          <div className="plot-interest-modal" style={{ maxWidth: '650px', width: '90%', borderRadius: '16px', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="plot-interest-modal-header" style={{ padding: '1.5rem 2rem', flexShrink: 0 }}>
              <h2 className="plot-interest-modal-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>Builder Profile: {selectedBuilder.companyName || selectedBuilder.name || 'Details'}</h2>
              <button type="button" className="plot-interest-modal-close" onClick={() => setSelectedBuilder(null)}>×</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2rem 3rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* General Information */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '700', color: '#0a8870' }}>General Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Name</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.name || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Name</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.companyName || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.email || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Phone</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.phone || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alternate Phone</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.alternatePhone || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About Company</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#334155' }}>{selectedBuilder.about || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '700', color: '#0a8870' }}>Address</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Street Address</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.address || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.city || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State / Province</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.state || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.country || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Business Registration */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '700', color: '#0a8870' }}>Business Registration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GST Number</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.gst || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RERA Registration</label>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedBuilder.rera || '—'}</strong>
                  </div>
                </div>
              </div>

            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 2rem', borderTop: '1px solid var(--color-border)' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedBuilder(null)} style={{ borderRadius: '8px', padding: '0.6rem 1.25rem' }}>
                Close
              </button>
            </div>
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
