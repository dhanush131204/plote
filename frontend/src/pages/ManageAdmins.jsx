import { useState } from 'react';
import { useGetAdminUsersQuery, useUpdateAdminUserMutation, useCreateAdminUserMutation, useDeleteAdminUserMutation } from '../api/apiSlice';

export default function ManageAdmins() {
  const { data: users, isLoading } = useGetAdminUsersQuery();
  const [updateUser] = useUpdateAdminUserMutation();
  const [createUser] = useCreateAdminUserMutation();
  const [deleteUser] = useDeleteAdminUserMutation();
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', companyName: '' });
  const [error, setError] = useState('');

  const handleToggleStatus = async (user) => {
    if (user.role === 'super_admin') {
      alert("Cannot disable a super admin directly.");
      return;
    }
    const newStatus = user.status === 'disabled' ? 'active' : 'disabled';
    if (window.confirm(`Are you sure you want to ${newStatus} the account for ${user.companyName || user.email}?`)) {
      try {
        await updateUser({ id: user.id, status: newStatus }).unwrap();
        // If the current viewed builder's status changes, update the modal data as well
        if (selectedBuilder && selectedBuilder.id === user.id) {
          setSelectedBuilder({ ...selectedBuilder, status: newStatus });
        }
      } catch (err) {
        alert("Failed to update status.");
      }
    }
  };

  const handleDelete = async (user) => {
    if (user.role === 'super_admin') {
      alert("Cannot delete a super admin.");
      return;
    }
    if (window.confirm(`Are you absolutely sure you want to DELETE the account for ${user.companyName || user.email}? This action cannot be undone.`)) {
      try {
        await deleteUser(user.id).unwrap();
        if (selectedBuilder && selectedBuilder.id === user.id) {
          setSelectedBuilder(null);
        }
      } catch (err) {
        alert(err?.data?.error || "Failed to delete user.");
      }
    }
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

  return (
    <div className="dashboard-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="welcome-title">Manage Builders</h1>
          <p className="welcome-subtitle">Configure, disable, and monitor builder accounts.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add Builder</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr style={{ background: 'var(--color-bg-wash)' }}>
              <th>Builder Name</th>
              <th>Company Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {builders.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: '600' }}>{u.name || 'Not Set'}</td>
                <td>{u.companyName || 'Not Set'}</td>
                <td>{u.email}</td>
                <td>{u.phone || 'Not Set'}</td>
                <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => setSelectedBuilder(u)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    View Profile
                  </button>
                  <button 
                    className={u.status === 'disabled' ? 'btn-secondary' : 'btn-danger'} 
                    onClick={() => handleToggleStatus(u)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    {u.status === 'disabled' ? 'Enable' : 'Disable'}
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleDelete(u)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {builders.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No builders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="plot-interest-modal-root">
          <div className="plot-interest-modal-backdrop" onClick={() => setModalOpen(false)} />
          <div className="plot-interest-modal">
            <div className="plot-interest-modal-header">
              <h2 className="plot-interest-modal-title">Create Builder Account</h2>
              <button className="plot-interest-modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form className="plot-interest-modal-form" onSubmit={handleCreate}>
              {error && <div className="panel-inline-error">{error}</div>}
              <label className="plot-interest-label">
                <span className="sr-only">Builder Name</span>
                <input type="text" placeholder="Builder Name" required className="panel-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Company Name</span>
                <input type="text" placeholder="Company Name" required className="panel-input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Login Email</span>
                <input type="email" placeholder="Login Email" required className="panel-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Phone Number</span>
                <input type="tel" placeholder="Phone Number" required className="panel-input" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </label>
              <label className="plot-interest-label">
                <span className="sr-only">Temporary Password</span>
                <input type="password" placeholder="Temporary Password" required className="panel-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </label>
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Create Account</button>
            </form>
          </div>
        </div>
      )}

      {selectedBuilder && (
        <div className="plot-interest-modal-root" role="dialog" aria-modal="true">
          <div className="plot-interest-modal-backdrop" onClick={() => setSelectedBuilder(null)} />
          <div className="plot-interest-modal" style={{ maxWidth: '650px', width: '90%' }}>
            <div className="plot-interest-modal-header">
              <h2 className="plot-interest-modal-title">Builder Profile: {selectedBuilder.companyName || selectedBuilder.name || 'Details'}</h2>
              <button type="button" className="plot-interest-modal-close" onClick={() => setSelectedBuilder(null)}>×</button>
            </div>
            
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* General Information */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-accent)' }}>General Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Personal Name</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.name || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Company Name</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.companyName || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Email Address</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.email || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Primary Phone</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.phone || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Alternate Phone</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.alternatePhone || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>About Company</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{selectedBuilder.about || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-accent)' }}>Address</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Street Address</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.address || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>City</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.city || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>State / Province</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.state || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Country</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.country || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Business Registration */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-accent)' }}>Business Registration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>GST Number</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.gst || '—'}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>RERA Registration</label>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedBuilder.rera || '—'}</strong>
                  </div>
                </div>
              </div>

            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedBuilder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
