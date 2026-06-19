import React from 'react';
import { useGetAdminPaymentsQuery } from '../api/apiSlice';
import { normalizeDateValue } from '../utils/dateUtils';

export default function SuperAdminPayments() {
  const { data: payments = [], isLoading, error } = useGetAdminPaymentsQuery();

  const formatDate = (value) => {
    const normalized = normalizeDateValue(value);
    if (!normalized) return '—';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '—';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) return <div className="app-loading">Loading Payments...</div>;
  if (error) return <div className="dashboard-error">Failed to load payments.</div>;

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="welcome-title" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Payments</h1>
        <p className="welcome-subtitle" style={{ fontSize: '1rem', color: '#64748b' }}>Track transaction history and pending upgrades.</p>
      </div>

      <div className="admin-table-wrap" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', background: '#fff' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem', color: '#475569' }}>Date</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem', color: '#475569' }}>Builder</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem', color: '#475569' }}>Amount</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem', color: '#475569' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem', color: '#475569' }}>Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1.5rem', color: '#64748b' }}>{formatDate(p.createdAt)}</td>
                <td style={{ padding: '1.5rem', fontWeight: '600' }}>
                  {p.user?.companyName || p.user?.name || 'Unknown User'}
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '400', marginTop: '0.25rem' }}>{p.user?.email}</div>
                </td>
                <td style={{ padding: '1.5rem', fontWeight: '700', color: '#0f172a' }}>₹{p.amount}</td>
                <td style={{ padding: '1.5rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: p.status === 'completed' ? '#dcfce7' : '#fef08a', color: p.status === 'completed' ? '#166534' : '#854d0e' }}>
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1.5rem', textTransform: 'capitalize' }}>{p.paymentMethod || 'Manual'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No payments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
