import { useState, useEffect } from 'react';
import { useGetAdminLeadsQuery, usePushLeadWebhookMutation, useUpdateLeadStatusMutation } from '../api/apiSlice';
import { normalizeDateValue } from '../utils/dateUtils';

export default function Leads() {
  const { data: leadsData, isLoading: loadingLeads, error: errorLeads } = useGetAdminLeadsQuery(100);
  const [pushWebhookTrigger] = usePushLeadWebhookMutation();

  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [updateLeadStatus] = useUpdateLeadStatusMutation();

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
        <div className="dashboard-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem'}}>Leads Pipeline</h1>
            <p style={{color: 'var(--color-text-muted)'}}>Manage your incoming inquiries and contacts.</p>
          </div>
        </div>

        <section className="premium-kpi-grid" style={{marginBottom: '2rem'}}>
          <div className="premium-stat-card">
            <div className="premium-stat-header">
              <span>Total Leads</span>
            </div>
            <div className="premium-stat-value">{leadsTotal}</div>
          </div>
          <div className="premium-stat-card">
            <div className="premium-stat-header">
              <span>New</span>
            </div>
            <div className="premium-stat-value" style={{color: 'var(--color-booked)'}}>{newLeadsCount}</div>
          </div>
          <div className="premium-stat-card">
            <div className="premium-stat-header">
              <span>Contacted</span>
            </div>
            <div className="premium-stat-value" style={{color: 'var(--color-available)'}}>{contactedCount}</div>
          </div>
        </section>

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
                {leads.map((l) => {
                  const lStatus = (l.status || 'new').toLowerCase();
                  return (
                  <tr key={l.id} style={{borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', transition: 'background 0.2s'}}>
                    <td style={{padding: '1rem', color: 'var(--color-text-muted)'}}>{formatDate(l.createdAt)}</td>
                    <td style={{padding: '1rem', fontWeight: '600'}}>{l.layoutName}</td>
                    <td style={{padding: '1rem'}}>{l.unitId || l.plotId} {l.unitTower ? `(${l.unitTower})` : ''}</td>
                    <td style={{padding: '1rem'}}>
                      <div style={{fontWeight: 600}}>{l.customerName}</div>
                    </td>
                    <td style={{padding: '1rem'}}>
                      <div>{l.contactNumber}</div>
                      <div style={{color: 'var(--color-text-muted)', fontSize: '0.85rem'}}>{l.customerEmail}</div>
                    </td>
                    <td style={{padding: '1rem'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        <select value={lStatus} onChange={async (e) => {
                          setError(''); setStatusMsg(''); setUpdatingId(l.id);
                          try {
                            await updateLeadStatus({ id: l.id, status: e.target.value }).unwrap();
                            setStatusMsg('Status updated');
                          } catch (err) {
                            setError(err.data?.error || err.message || 'Failed to update status');
                          } finally {
                            setUpdatingId(null);
                            setTimeout(() => setStatusMsg(''), 3000);
                          }
                        }} disabled={updatingId===l.id} style={{padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none'}}>
                          <option value="new">New</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="sold">Sold</option>
                        </select>
                      </div>
                    </td>
                    <td style={{padding: '1rem', textAlign: 'right'}}>
                      <button type="button" className="btn-secondary" style={{padding: '0.4rem 0.75rem', fontSize: '0.8125rem'}} onClick={() => pushLeadWebhook(l.id)}>
                        Push Webhook
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
