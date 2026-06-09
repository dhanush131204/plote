import { useState } from 'react';
import { useGetAdminUsersQuery } from '../api/apiSlice';
import AddUserModal from '../components/AddUserModal';
import { normalizeDateValue } from '../utils/dateUtils';

export default function Users() {
  const { data: users = [], isLoading, error: queryError } = useGetAdminUsersQuery();
  const [isAdding, setIsAdding] = useState(false);

  const formatDate = (value) => {
    const normalized = normalizeDateValue(value);
    if (!normalized) return '—';

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '—';
    return date.toLocaleDateString();
  };

  if (isLoading) return <div className="app-loading">Loading Users...</div>;

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{marginBottom: '2rem'}}>
        <div className="welcome-content">
          <p className="section-kicker">People</p>
          <h1 className="welcome-title">Customers</h1>
          <p className="welcome-subtitle">Manage buyer accounts, admin access, and demo users from one clean place.</p>
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

      {queryError && <div className="dashboard-error">Failed to load users.</div>}

      <div style={{marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
        <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : '+ Add New User'}
        </button>
      </div>

      <AddUserModal isOpen={isAdding} onClose={() => setIsAdding(false)} />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Created Date</th>
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
                <td>{formatDate(u.createdAt)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="3" style={{textAlign: 'center', padding: '2rem'}}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
