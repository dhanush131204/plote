import { useParams, Link } from 'react-router-dom';
import { useTrackLeadQuery } from '../api/apiSlice';

export default function TrackLeadPage() {
  const { trackingId } = useParams();
  const { data: lead, isLoading, error } = useTrackLeadQuery(trackingId);

  if (isLoading) {
    return <div className="app-loading">Loading tracking details...</div>;
  }

  if (error || !lead) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          {error?.data?.error || 'Tracking ID not found. Please check your link.'}
        </div>
      </div>
    );
  }

  const renderTimeline = (currentStatus) => {
    const statusFlow = ['new', 'contacted', 'qualified', 'site visit scheduled', 'negotiation', 'booked', 'sold'];
    const current = (currentStatus || 'new').toLowerCase();
    
    if (current === 'rejected') {
      return (
        <div className="timeline-rejected" style={{ padding: '1rem', background: 'var(--color-danger)', color: 'white', borderRadius: 'var(--radius-md)' }}>
          Status: Rejected
        </div>
      );
    }

    const currentIndex = statusFlow.indexOf(current) >= 0 ? statusFlow.indexOf(current) : 0;

    return (
      <div className="status-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {statusFlow.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isCompleted ? 1 : 0.4 }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: isActive ? 'var(--color-primary)' : (isCompleted ? 'var(--color-success)' : 'var(--color-border)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>
                {isCompleted && !isActive ? '✓' : ''}
              </div>
              <div style={{ fontWeight: isActive ? 'bold' : 'normal', textTransform: 'capitalize' }}>
                {status}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <p className="section-kicker">Tracking ID: {lead.trackingId}</p>
          <h1 className="welcome-title">Lead Status</h1>
          <p className="welcome-subtitle">Track the progress of your interest</p>
        </div>
      </section>

      <div className="contact-info-card" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>{lead.layoutName}</h3>
          <div style={{ color: 'var(--color-text-muted)' }}>
            {lead.inventoryType === 'unit' ? 'Unit' : 'Plot'}: {lead.plotId} 
            {lead.unitFloor ? ` · Floor ${lead.unitFloor}` : ''}
            {lead.unitTower ? ` · Tower ${lead.unitTower}` : ''}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Submitted: {new Date(lead.createdAt).toLocaleString()}
          </div>
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />
        
        <h4 style={{ margin: '0 0 1rem 0' }}>Current Progress</h4>
        {renderTimeline(lead.status)}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to={`/v/${lead.layoutSlug}?plotId=${lead.plotId}`} className="btn-secondary">
          View Project Map
        </Link>
      </div>
    </div>
  );
}
