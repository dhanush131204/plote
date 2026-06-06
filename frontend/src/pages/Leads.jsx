import { useState, useEffect } from 'react';
import { useGetAdminLeadsQuery, usePushLeadWebhookMutation } from '../api/apiSlice';

export default function Leads() {
  const { data: leadsData, isLoading: loadingLeads, error: errorLeads } = useGetAdminLeadsQuery(100);
  const [pushWebhookTrigger] = usePushLeadWebhookMutation();

  const [error, setError] = useState('');

  useEffect(() => {
    if (errorLeads) {
      setError(errorLeads.data?.error || errorLeads.error || 'Failed to fetch admin data');
    }
  }, [errorLeads]);

  const leads = leadsData?.leads || [];
  const leadsTotal = leadsData?.total ?? 0;
  
  const contactedCount = leads.filter(l => l.webhookDeliveredAt).length;
  const newLeadsCount = leadsTotal - contactedCount;

  const pushLeadWebhook = async (leadId) => {
    setError('');
    try {
      await pushWebhookTrigger(leadId).unwrap();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to push webhook');
    }
  };

  if (loadingLeads) return <div className="app-loading">Loading CRM...</div>;

  return (
    <div className="dashboard-container">
      {error && <div className="dashboard-error">{error}</div>}

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
                  <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Unit / Plot</th>
                  <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Contact Name</th>
                  <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Phone / Email</th>
                  <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Status</th>
                  <th style={{padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'var(--color-text-muted)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{borderTop: '1px solid var(--color-border)'}}>
                    <td style={{padding: '1rem'}}>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td style={{padding: '1rem', fontWeight: '500'}}>{l.layoutName}</td>
                    <td style={{padding: '1rem'}}>{l.unitId || l.plotId} {l.unitTower ? `(${l.unitTower})` : ''}</td>
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
    </div>
  );
}
