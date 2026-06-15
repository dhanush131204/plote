import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  useGetAdminLeadsQuery,
  usePushLeadWebhookMutation,
  useUpdateAdminUserMutation,
} from '../api/apiSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizeDateValue } from '../utils/dateUtils';

export default function Admin() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const isSettings = location.pathname.includes('settings');
  const [tab, setTab] = useState(isSettings ? 'settings' : 'leads');
  const navigate = useNavigate();

  const { data: leadsData, isLoading: loadingLeads, error: errorLeads } = useGetAdminLeadsQuery(100);
  const [pushWebhookTrigger] = usePushLeadWebhookMutation();
  const [updateAdminUser] = useUpdateAdminUserMutation();

  const [error, setError] = useState('');
  
  // Settings state
  const [editPassword, setEditPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    setTab(isSettings ? 'settings' : 'leads');
  }, [isSettings]);

  useEffect(() => {
    if (errorLeads) {
      setError(errorLeads.data?.error || errorLeads.error || 'Failed to fetch admin data');
    }
  }, [errorLeads]);

  const leads = leadsData?.leads || [];
  const leadsTotal = leadsData?.total ?? 0;
  
  const contactedCount = leads.filter(l => l.webhookDeliveredAt).length;
  const newLeadsCount = leadsTotal - contactedCount;

  const formatDate = (value) => {
    const normalized = normalizeDateValue(value);
    if (!normalized) return '—';

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '—';
    return date.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    const normalized = normalizeDateValue(value);
    if (!normalized) return '—';

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '—';
    return date.toLocaleString();
  };

  const pushLeadWebhook = async (leadId) => {
    setError('');
    try {
      await pushWebhookTrigger(leadId).unwrap();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to push webhook');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (editPassword.trim() && editPassword.trim().length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setEditSaving(true);
    setError('');
    try {
      const body = {
        id: user.id,
        email: user.email,
        role: user.role,
        autoWebhookOnSubmit: user.autoWebhookOnSubmit,
      };
      if (editPassword.trim()) {
        body.password = editPassword.trim();
      }
      await updateAdminUser(body).unwrap();
      await refreshUser();
      setEditPassword('');
      alert("Profile updated successfully.");
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  };

  if (loadingLeads) return <div className="app-loading">Loading CRM...</div>;

  return (
    <div className="dashboard-container">
      <div className="admin-header-tabs" style={{display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '2rem'}}>
        <button 
          className={`btn-ghost ${tab === 'leads' ? 'active' : ''}`} 
          style={{ fontWeight: tab === 'leads' ? '600' : '400', color: tab === 'leads' ? 'var(--color-accent)' : 'inherit' }}
          onClick={() => { setTab('leads'); navigate('/admin'); }}
        >
          Leads CRM
        </button>
        <button 
          className={`btn-ghost ${tab === 'settings' ? 'active' : ''}`}
          style={{ fontWeight: tab === 'settings' ? '600' : '400', color: tab === 'settings' ? 'var(--color-accent)' : 'inherit' }}
          onClick={() => { setTab('settings'); navigate('/settings'); }}
        >
          Profile Settings
        </button>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {tab === 'leads' && (
        <section className="crm-section">
          <div className="welcome-banner" style={{marginBottom: '2rem'}}>
            <div className="welcome-content">
              <h1 className="welcome-title">Leads Pipeline</h1>
              <p className="welcome-subtitle">Manage your incoming inquiries and contacts.</p>
            </div>
            <div className="welcome-stats">
              <div className="stat-badge">
                <span className="stat-value">{leadsTotal}</span>
                <span className="stat-label">Total Leads</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value" style={{color: 'var(--color-booked)'}}>{newLeadsCount}</span>
                <span className="stat-label">New</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value" style={{color: 'var(--color-available)'}}>{contactedCount}</span>
                <span className="stat-label">Contacted</span>
              </div>
            </div>
          </div>

          {leads.length === 0 ? (
             <div className="empty-state-premium">
                <div className="empty-illustration">📇</div>
                <h3>No Leads Yet</h3>
                <p>When buyers show interest in your projects, their details will appear here in your CRM.</p>
             </div>
          ) : (
            <div className="admin-table-wrap" style={{background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--color-border)'}}>
              <table className="admin-table" style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{background: 'var(--color-bg-wash)'}}>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Date</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Project</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Type (Plot or Building)</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Contact Name</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Phone / Email</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Status</th>
                    <th style={{padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'var(--color-text-muted)'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} style={{borderTop: '1px solid var(--color-border)'}}>
                      <td style={{padding: '1rem'}}>{formatDate(l.createdAt)}</td>
                      <td style={{padding: '1rem', fontWeight: '500'}}>{l.layoutName}</td>
                      <td style={{padding: '1rem'}}>{l.unitId ? 'Building' : 'Plot'}</td>
                      <td style={{padding: '1rem', fontWeight: '500'}}>{l.customerName}</td>
                      <td style={{padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem'}}>
                        <div>{l.contactNumber}</div>
                        <div>{l.customerEmail}</div>
                      </td>
                      <td style={{padding: '1rem'}}>
                        {l.webhookDeliveredAt ? (
                          <span style={{background: 'var(--color-available)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem'}}>Contacted</span>
                        ) : l.webhookLastError ? (
                          <span style={{background: 'var(--color-danger)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem'}}>Failed</span>
                        ) : (
                          <span style={{background: 'var(--color-booked)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem'}}>New</span>
                        )}
                      </td>
                      <td style={{padding: '1rem', textAlign: 'right'}}>
                        <button type="button" className="btn-secondary" style={{padding: '0.4rem 0.75rem', fontSize: '0.8125rem'}} onClick={() => pushLeadWebhook(l.id)}>
                          Push Webhook
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'settings' && (
        <section className="settings-section">
          <div className="section-header">
            <h1 className="section-title">Profile Settings</h1>
          </div>
          <div style={{maxWidth: '600px', background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)'}}>
            <form onSubmit={handleSaveProfile} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                <label style={{fontWeight: '600', fontSize: '0.875rem'}}>Email Address</label>
                <input type="email" value={user?.email || ''} disabled style={{padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-wash)', color: 'var(--color-text-muted)'}} />
                <p style={{fontSize: '0.75rem', color: 'var(--color-text-muted)'}}>Email address cannot be changed.</p>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                <label style={{fontWeight: '600', fontSize: '0.875rem'}}>New Password</label>
                <input 
                  type="password" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  placeholder="Leave blank to keep current password"
                  style={{padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'}}
                />
              </div>

              <div style={{borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? 'Saving Changes...' : 'Save Profile Settings'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
