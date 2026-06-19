import React, { useState, useEffect } from 'react';
import { useGetAdminSubscriptionsQuery, useOverrideSubscriptionMutation } from '../api/apiSlice';
import { normalizeDateValue } from '../utils/dateUtils';

const PLAN_COLORS = {
  FREE:  { bg: '#f1f5f9', color: '#475569' },
  TIER1: { bg: '#dbeafe', color: '#1e40af' },
  TIER2: { bg: '#ede9fe', color: '#5b21b6' },
  TIER3: { bg: '#fce7f3', color: '#9d174d' },
};
const STATUS_COLORS = {
  ACTIVE:  { bg: '#dcfce7', color: '#166534' },
  PENDING: { bg: '#fef9c3', color: '#854d0e' },
  EXPIRED: { bg: '#fee2e2', color: '#991b1b' },
};

function EditPlanModal({ isOpen, onClose, user }) {
  const [overrideSubscription, { isLoading }] = useOverrideSubscriptionMutation();
  const [formData, setFormData] = useState({
    plan: 'FREE',
    planStatus: 'ACTIVE',
    maxLayouts: '',
    maxViews: '',
    planExpiresAt: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        plan: user.plan || 'FREE',
        planStatus: user.planStatus || 'ACTIVE',
        maxLayouts: user.maxLayouts || '',
        maxViews: user.maxViews || '',
        planExpiresAt: user.planExpiresAt
          ? normalizeDateValue(user.planExpiresAt)?.split('T')[0] ?? ''
          : '',
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await overrideSubscription({
        userId: user.id,
        plan: formData.plan,
        planStatus: formData.planStatus,
        maxLayouts: formData.maxLayouts ? Number(formData.maxLayouts) : null,
        maxViews: formData.maxViews ? Number(formData.maxViews) : null,
        planExpiresAt: formData.planExpiresAt
          ? new Date(formData.planExpiresAt).toISOString()
          : null,
      }).unwrap();
      onClose();
    } catch (err) {
      alert('Failed to update plan: ' + (err.data?.error || err.error || 'Server error'));
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.95rem',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.75rem 2rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Edit Plan
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                {user.companyName || user.name || user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Plan Tier</label>
              <select name="plan" value={formData.plan} onChange={handleChange} style={inputStyle}>
                <option value="FREE">Free</option>
                <option value="TIER1">Tier 1 — Pro</option>
                <option value="TIER2">Tier 2 — Business</option>
                <option value="TIER3">Tier 3 — Enterprise</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="planStatus" value={formData.planStatus} onChange={handleChange} style={inputStyle}>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Max Layouts</label>
              <input
                type="number"
                name="maxLayouts"
                value={formData.maxLayouts}
                onChange={handleChange}
                placeholder="Default"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Views</label>
              <input
                type="number"
                name="maxViews"
                value={formData.maxViews}
                onChange={handleChange}
                placeholder="Default"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Expiry Date (Optional)</label>
            <input
              type="date"
              name="planExpiresAt"
              value={formData.planExpiresAt}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.875rem', borderRadius: '10px',
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#475569', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1, padding: '0.875rem', borderRadius: '10px',
                border: 'none', background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: '#fff', fontWeight: '700', fontSize: '0.95rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminSubscriptions() {
  const { data: users = [], isLoading, error } = useGetAdminSubscriptionsQuery();
  const [editingUser, setEditingUser] = useState(null);

  if (isLoading) return <div className="app-loading">Loading Subscriptions...</div>;
  if (error) return <div className="dashboard-error">Failed to load subscriptions.</div>;

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <p className="section-kicker">Billing</p>
          <h1 className="welcome-title">Subscriptions</h1>
          <p className="welcome-subtitle">Manage builder plans, limits, and renewals.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total Builders</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value" style={{ color: 'var(--color-booked)' }}>
              {users.filter(u => u.planStatus === 'ACTIVE' && u.plan !== 'FREE').length}
            </span>
            <span className="stat-label">Active Paid</span>
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="admin-table-wrap" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', background: '#fff' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Builder', 'Plan', 'Status', 'Max Layouts', 'Actions'].map(h => (
                <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const pc = PLAN_COLORS[u.plan] || PLAN_COLORS.FREE;
              const sc = STATUS_COLORS[u.planStatus] || STATUS_COLORS.PENDING;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{u.companyName || u.name || 'Unnamed Builder'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', background: pc.bg, color: pc.color }}>
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', background: sc.bg, color: sc.color }}>
                      {u.planStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: u.maxLayouts ? '#0f172a' : '#94a3b8' }}>
                    {u.maxLayouts ? `${u.maxLayouts} (Custom)` : 'Default'}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <button
                      onClick={() => setEditingUser(u)}
                      style={{
                        padding: '0.5rem 1.1rem', borderRadius: '8px',
                        border: '1.5px solid #e2e8f0', background: '#fff',
                        color: '#334155', fontWeight: '600', fontSize: '0.82rem',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.background = '#6366f1'; e.target.style.color = '#fff'; e.target.style.borderColor = '#6366f1'; }}
                      onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#334155'; e.target.style.borderColor = '#e2e8f0'; }}
                    >
                      Edit Plan
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>
                  No builders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditPlanModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} />
    </div>
  );
}
