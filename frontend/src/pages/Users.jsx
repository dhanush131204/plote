import { useState } from 'react';
import { useGetAdminUsersQuery, useUpdateAdminUserMutation, useCreateAdminUserMutation } from '../api/apiSlice';

export default function Users() {
  const { data: users = [], isLoading, error: queryError } = useGetAdminUsersQuery();
  const [updateAdminUser] = useUpdateAdminUserMutation();
  const [createAdminUser] = useCreateAdminUserMutation();

  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  const handleToggleStatus = async (user) => {
    try {
      await updateAdminUser({ id: user.id, isActive: !user.isActive }).unwrap();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update user status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      setError('Email and Password are required');
      return;
    }
    setError('');
    try {
      await createAdminUser({ email: newUserEmail, password: newUserPassword, role: newUserRole }).unwrap();
      setIsAdding(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create user');
    }
  };

  if (isLoading) return <div className="app-loading">Loading Users...</div>;

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{marginBottom: '2rem'}}>
        <div className="welcome-content">
          <h1 className="welcome-title">User Management</h1>
          <p className="welcome-subtitle">Manage admins, buyers, and their access.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value" style={{color: 'var(--color-booked)'}}>{users.filter(u => u.role === 'admin').length}</span>
            <span className="stat-label">Admins</span>
          </div>
        </div>
      </section>

      {error && <div className="dashboard-error">{error}</div>}
      {queryError && <div className="dashboard-error">Failed to load users.</div>}

      <div style={{marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
        <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : '+ Add New User'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateUser} className="admin-form" style={{marginBottom: '2rem'}}>
          <h3>Add New User</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div>
              <label style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem'}}>Email</label>
              <input 
                type="email" 
                value={newUserEmail} 
                onChange={(e) => setNewUserEmail(e.target.value)} 
                style={{width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)'}} 
                required 
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem'}}>Password</label>
              <input 
                type="password" 
                value={newUserPassword} 
                onChange={(e) => setNewUserPassword(e.target.value)} 
                style={{width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)'}} 
                required 
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem'}}>Role</label>
              <select 
                value={newUserRole} 
                onChange={(e) => setNewUserRole(e.target.value)}
                style={{width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)'}}
              >
                <option value="user">User / Buyer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{marginTop: '0.5rem'}}>
              <button type="submit" className="btn-primary">Create User</button>
            </div>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created Date</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{fontWeight: '500'}}>{u.email}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '999px', 
                    fontSize: '0.75rem', 
                    background: u.role === 'admin' ? 'var(--color-booked)' : 'var(--color-bg-wash)',
                    color: u.role === 'admin' ? '#fff' : 'inherit'
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>
                  {u.isActive !== false ? (
                    <span style={{color: 'var(--color-available)', fontWeight: '600'}}>Active</span>
                  ) : (
                    <span style={{color: 'var(--color-danger)', fontWeight: '600'}}>Inactive</span>
                  )}
                </td>
                <td>{new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                <td style={{textAlign: 'right'}}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.isActive !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
