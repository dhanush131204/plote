import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGetAdminLeadsQuery } from '../api/apiSlice';

export default function MyInterestsPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  // Enable fetching for both roles. Ensure the backend endpoint filters data by user email for non-admins.
  // Fetch leads only if isAdmin is true, otherwise skip the query to prevent 403 errors for buyers.
  const { data: leadsData, isLoading: loadingLeads, error: errorLeads } = useGetAdminLeadsQuery(100, { skip: !isAdmin }); 
  const [error, setError] = useState('');

  useEffect(() => {
    if (errorLeads) {
      setError(errorLeads.data?.error || errorLeads.error || 'Failed to fetch your interests');
    }
  }, [errorLeads]);

  const myInterests = useMemo(() => {
    if (!leadsData?.leads || !user?.email) return [];
    return leadsData.leads.filter(lead => lead.customerEmail === user.email);
  }, [leadsData, user]);

  const getStatusBadge = (lead) => {
    // Reusing existing status-related classes for visual consistency
    if (lead.webhookDeliveredAt) {
      return <span className="status-badge status-available" style={{ background: 'var(--color-available)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>Contacted</span>;
    }
    if (lead.webhookLastError) {
      return <span className="status-badge status-sold" style={{ background: 'var(--color-danger)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>Failed</span>;
    }
    return <span className="status-badge status-booked" style={{ background: 'var(--color-booked)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>Interested</span>;
  };

  if (loadingLeads) return <div className="app-loading">Loading your interests...</div>;

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <h1 className="welcome-title">My Interests</h1>
          <p className="welcome-subtitle">Properties where you have submitted an inquiry.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{myInterests.length}</span>
            <span className="stat-label">Total Inquiries</span>
          </div>
        </div>
      </section>

      {error && <div className="dashboard-error">{error}</div>}

      {myInterests.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-illustration">📝</div>
          <h3>No inquiries submitted yet</h3>
          <p>Submit your interest on a plot or unit to see it listed here.</p>
          <button className="btn-primary" onClick={() => navigate('/buyer/projects')}>Browse Projects</button>
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-wash)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)' }}>Project</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)' }}>Plot / Unit</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)' }}>Inquiry Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {myInterests.map((l) => (
                <tr key={l.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{l.layoutName}</td>
                  <td style={{ padding: '1rem' }}>{l.unitId || l.plotId} {l.unitTower ? `(${l.unitTower})` : ''}</td>
                  <td style={{ padding: '1rem' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    {getStatusBadge(l)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}