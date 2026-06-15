import { useState, useEffect } from 'react';
import { useGetAdminLeadsQuery, usePushLeadWebhookMutation, useUpdateLeadStatusMutation, useDeleteLeadMutation } from '../api/apiSlice';
import { normalizeDateValue } from '../utils/dateUtils';

export default function Leads() {
  const { data: leadsData, isLoading: loadingLeads, error: errorLeads } = useGetAdminLeadsQuery(100);
  const [pushWebhookTrigger] = usePushLeadWebhookMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [updateLeadStatus] = useUpdateLeadStatusMutation();

  const [confirmDialog, setConfirmDialog] = useState(null);

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

  const handleDeleteLead = (leadId, customerName) => {
    setConfirmDialog({
      title: 'Delete Lead',
      message: `Are you sure you want to delete the lead for "${customerName}"? This action cannot be undone.`,
      actionLabel: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        setError('');
        try {
          await deleteLead(leadId).unwrap();
        } catch (err) {
          setError(err.data?.error || err.message || 'Failed to delete lead');
        }
        setConfirmDialog(null);
      }
    });
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
          <div className="admin-table-wrap" style={{
            background: 'var(--color-surface)', 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', 
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            border: '1px solid var(--color-border)'
          }}>
            <table className="admin-table" style={{width: '100%', minWidth: '1100px', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f8fafc', borderBottom: '2px solid #e2e8f0'}}>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Date</th>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Project</th>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Type (Plot or Building)</th>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Contact Name</th>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Message / Requirements</th>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Phone / Email</th>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Status</th>
                  <th style={{padding: '1.25rem 1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const lStatus = (l.status || 'new').toLowerCase();
                  
                  // Color codes for select element
                  let statusStyles = { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }; // new/default
                  if (lStatus === 'approved') statusStyles = { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
                  else if (lStatus === 'sold') statusStyles = { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
                  else if (lStatus === 'pending') statusStyles = { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
                  else if (lStatus === 'rejected') statusStyles = { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };

                  let inquiryType = l.inquiryType || 'Booking';
                  let leadMessage = l.message || '';
                  try {
                    if (!inquiryType || inquiryType === 'Booking') {
                      const meta = l.metadata ? JSON.parse(l.metadata) : {};
                      if (meta?.inquiryType) inquiryType = meta.inquiryType;
                      if (!leadMessage && meta?.message) leadMessage = meta.message;
                    }
                  } catch (e) {
                    // Ignore
                  }

                  const lowerType = (inquiryType || 'Booking').toLowerCase();
                  let badgeBg = '#f1f5f9';
                  let badgeText = '#475569';
                  let badgeBorder = '#cbd5e1';
                  let icon = '💬';

                  if (lowerType.includes('visit')) {
                    badgeBg = '#eff6ff';
                    badgeText = '#1d4ed8';
                    badgeBorder = '#bfdbfe';
                    icon = '📅';
                  } else if (lowerType.includes('booking')) {
                    badgeBg = '#ecfdf5';
                    badgeText = '#047857';
                    badgeBorder = '#a7f3d0';
                    icon = '⚡';
                  }

                  return (
                  <tr key={l.id} style={{
                    borderTop: '1px solid var(--color-border)', 
                    background: 'var(--color-surface)', 
                    transition: 'background-color 0.25s'
                  }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.9rem'}}>{formatDate(l.createdAt)}</td>
                    <td style={{padding: '1.25rem 1.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem'}}>{l.layoutName}</td>
                    <td style={{padding: '1.25rem 1.5rem', color: '#334155', fontWeight: '500', fontSize: '0.9rem'}}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span>{l.unitId ? 'Building' : 'Plot'}</span>
                      </div>
                    </td>
                    <td style={{padding: '1.25rem 1.5rem'}}>
                      <div style={{fontWeight: '700', color: '#1e293b', fontSize: '0.95rem'}}>{l.customerName}</div>
                    </td>
                    <td style={{padding: '1.25rem 1.5rem', maxWidth: '280px'}}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ color: '#1e293b', fontSize: '0.9rem', lineHeight: '1.4', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {leadMessage || '—'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            background: badgeBg,
                            color: badgeText,
                            border: `1px solid ${badgeBorder}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em'
                          }}>
                            {icon} {inquiryType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: '1.25rem 1.5rem'}}>
                      <div style={{fontWeight: '600', color: '#334155', fontSize: '0.9rem'}}>{l.contactNumber}</div>
                      <div style={{color: '#64748b', fontSize: '0.8rem', marginTop: '0.15rem'}}>{l.customerEmail}</div>
                    </td>
                    <td style={{padding: '1.25rem 1.5rem'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        <select 
                          value={lStatus} 
                          onChange={async (e) => {
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
                          }} 
                          disabled={updatingId===l.id} 
                          style={{
                            padding: '0.4rem 1.75rem 0.4rem 0.75rem', 
                            borderRadius: '8px', 
                            border: `1px solid ${statusStyles.border}`, 
                            background: `${statusStyles.bg}`,
                            color: `${statusStyles.text}`,
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer',
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23475569\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '0.85rem',
                            transition: 'all 0.2s ease',
                            width: 'fit-content'
                          }}
                        >
                          <option value="new">New</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="sold">Sold</option>
                        </select>
                      </div>
                    </td>
                    <td style={{padding: '1.25rem 1.5rem', textAlign: 'center'}}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{
                            padding: '0.45rem 1rem', 
                            fontSize: '0.8rem', 
                            borderRadius: '8px', 
                            fontWeight: '600',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            color: '#475569',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }} 
                          onClick={() => pushLeadWebhook(l.id)}
                        >
                          Push Webhook
                        </button>
                        <button 
                          type="button" 
                          style={{
                            padding: '0.45rem 1rem', 
                            fontSize: '0.8rem', 
                            borderRadius: '8px', 
                            fontWeight: '600',
                            border: '1px solid #fee2e2',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                          }} 
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                          }}
                          onClick={() => handleDeleteLead(l.id, l.customerName)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
