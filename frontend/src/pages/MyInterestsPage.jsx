import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyInterestsPage() {
  const navigate = useNavigate();

  const [savedPlots, setSavedPlots] = useState([]);
  const [trackedLeads, setTrackedLeads] = useState([]);

  useEffect(() => {
    const storedPlots = JSON.parse(localStorage.getItem('savedPlots') || '[]');
    setSavedPlots(storedPlots);
    
    const storedLeads = JSON.parse(localStorage.getItem('trackedLeads') || '[]');
    setTrackedLeads(storedLeads);
  }, []);

  const handleRemoveSavedPlot = (plotIdToRemove) => {
    const updatedSavedPlots = savedPlots.filter(p => String(p.plotId) !== String(plotIdToRemove));
    localStorage.setItem('savedPlots', JSON.stringify(updatedSavedPlots));
    setSavedPlots(updatedSavedPlots);
  };

  const handleRemoveTrackedLead = (trackingId) => {
    const updated = trackedLeads.filter(l => l.trackingId !== trackingId);
    localStorage.setItem('trackedLeads', JSON.stringify(updated));
    setTrackedLeads(updated);
  };

  const formatPrice = (num) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <p className="section-kicker">Buyer journey</p>
          <h1 className="welcome-title">My Activity</h1>
          <p className="welcome-subtitle">Track your submitted interests and saved properties in one place.</p>
        </div>
      </section>

      {/* Interested Plots Section */}
      <section className="projects-section" style={{ marginBottom: '3rem' }}>
        <div className="section-header">
          <h2 className="section-title">Tracked Interests</h2>
        </div>
        {trackedLeads.length === 0 ? (
          <div className="empty-state-premium mini">
            <p>No interests tracked yet.</p>
            <button className="btn-primary" onClick={() => navigate('/buyer/projects')} style={{ marginTop: '1rem' }}>
              Browse Projects
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr style={{ background: 'var(--color-bg-wash)' }}>
                  <th>Tracking ID</th>
                  <th>Submitted</th>
                  <th>Project Name</th>
                  <th>Plot / Unit</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trackedLeads.map((lead) => (
                  <tr key={lead.trackingId}>
                    <td style={{ fontWeight: 'bold' }}>{lead.trackingId}</td>
                    <td>{new Date(lead.submittedDate).toLocaleDateString()}</td>
                    <td>{lead.layoutName}</td>
                    <td>{lead.plotNumber}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-secondary" onClick={() => navigate(`/track/${lead.trackingId}`)} style={{ marginRight: '0.5rem' }}>
                        Track Status
                      </button>
                      <button className="btn-danger" onClick={() => handleRemoveTrackedLead(lead.trackingId)}>
                        Clear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Saved Plots Section */}
      <section className="projects-section" style={{ marginBottom: '3rem' }}>
        <div className="section-header">
          <h2 className="section-title">Saved Plots</h2>
        </div>
        {savedPlots.length === 0 ? (
          <div className="empty-state-premium mini">
            <p>No saved plots yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr style={{ background: 'var(--color-bg-wash)' }}>
                  <th>Project Name</th>
                  <th>Plot Number</th>
                  <th>Area</th>
                  <th>Facing</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedPlots.map((plot) => (
                  <tr key={`${plot.layoutId}-${plot.plotId}`}>
                    <td>{plot.layoutName}</td>
                    <td>{plot.number}</td>
                    <td>{plot.areaCent} Cent</td>
                    <td>{plot.facing || 'N/A'}</td>
                    <td>{formatPrice(plot.estimatedPrice)}</td>
                    <td><span className={`status-${(plot.status || 'available').toLowerCase()}`}>{plot.status || 'Available'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-secondary" onClick={() => navigate(`/v/${plot.layoutSlug}?plotId=${plot.plotId}`)} style={{ marginRight: '0.5rem' }}>
                        View Plot
                      </button>
                      <button className="btn-danger" onClick={() => handleRemoveSavedPlot(plot.plotId)}>
                        Remove
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
