import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGetLayoutsQuery, useGetMyLeadsQuery } from '../api/apiSlice';
import { normalizeDateValue } from '../utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function MyInterestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: layouts = [], isLoading: layoutsLoading, error: layoutsError } = useGetLayoutsQuery();
  // Use buyer-specific leads query to avoid 403 Admin Lead API errors
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useGetMyLeadsQuery(undefined, {
    skip: !user?.token,
  });

  const [savedPlots, setSavedPlots] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('savedPlots') || '[]');
    setSavedPlots(stored);
  }, []);

  const interestedPlots = useMemo(() => {
    if (!leadsData?.leads || !user?.email || layoutsLoading || !layouts) return [];

    return leadsData.leads
      .filter(lead => {
        const leadEmail = (lead.customerEmail || lead.email || '').toLowerCase();
        const authEmail = (user.email || '').toLowerCase();
        return leadEmail === authEmail && authEmail !== '';
      })
      .map((lead) => {
        const layout = (layouts || []).find(l => String(l.id) === String(lead.layoutId));
        if (!layout) return null;

        let plot = null;
        const targetPlotId = String(lead.plotId || lead.unitId || '');

        plot = (layout.plots || []).find(p => String(p.id) === targetPlotId || String(p.number) === targetPlotId);
        if (!plot) return null;

        return {
          ...plot,
          layoutName: layout.name,
          layoutSlug: layout.slug,
          submittedDate: lead.createdAt,
          status: lead.status || 'new',
          statusUpdatedAt: lead.statusUpdatedAt || null,
        };
      })
      .filter(Boolean); // Remove any null entries if plot/layout not found
  }, [leadsData, user, layouts, layoutsLoading]);


  const savedPlotDetails = useMemo(() => {
    if (layoutsLoading) return [];

    return (savedPlots || [])
      .map((saved) => {
        const layout = (layouts || []).find(l => String(l.id) === String(saved.layoutId));
        if (!layout) return null;

        let plot = null;
        const targetPlotId = String(saved.plotId || '');

        plot = (layout.plots || []).find(p => String(p.id) === targetPlotId || String(p.number) === targetPlotId);

        if (!plot) return null;

        return {
          ...plot,
          layoutName: layout.name,
          layoutSlug: layout.slug,
        };
      })
      .filter(Boolean);
  }, [savedPlots, layouts, layoutsLoading]);

  const handleRemoveSavedPlot = (plotIdToRemove) => {
    const updatedSavedPlots = savedPlots.filter(p => String(p.plotId) !== String(plotIdToRemove));
    localStorage.setItem('savedPlots', JSON.stringify(updatedSavedPlots));
    setSavedPlots(updatedSavedPlots);
  };

  const formatPrice = (num) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

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

  const renderStatusBadge = (status) => {
    const normalized = String(status || 'new').toLowerCase();
    const badgeColors = {
      new: 'var(--color-booked)',
      pending: '#f59e0b',
      approved: 'var(--color-available)',
      rejected: 'var(--color-danger)',
      contacted: 'var(--color-available)',
    };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.35rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#ffffff',
          background: badgeColors[normalized] || 'var(--color-text-muted)',
        }}
      >
        {normalized === 'new' ? 'New' : normalized.charAt(0).toUpperCase() + normalized.slice(1)}
      </span>
    );
  };

  if (layoutsLoading || leadsLoading) return <div className="app-loading">Loading interests...</div>;

  // Show specific error if the API is restricted
  if (leadsError) {
    const errorMessage =
      leadsError.data?.error ||
      leadsError.error ||
      (leadsError.status === 403 ? 'You do not have permission to view lead data.' : 'Error loading interests.');

    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          {errorMessage}
        </div>
      </div>
    );
  }

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
          <h2 className="section-title">Interested Plots</h2>
        </div>
        {(!interestedPlots || interestedPlots.length === 0) ? (
          <div className="empty-state-premium mini">
            <p>No interests submitted yet.</p>
            <button className="btn-primary" onClick={() => navigate('/buyer/projects')} style={{ marginTop: '1rem' }}>
              Browse Projects
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr style={{ background: 'var(--color-bg-wash)' }}>
                  <th>Submitted</th>
                  <th>Project</th>
                  <th>Plot / Unit</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interestedPlots.map((plot) => (
                  <tr key={`${plot.layoutId}-${plot.id}-${plot.submittedDate}`}>
                    <td>{formatDate(plot.submittedDate)}</td>
                    <td>{plot.layoutName}</td>
                    <td>{plot.number}{plot.floor || plot.tower ? ` · ${plot.floor ?? ''}${plot.floor && plot.tower ? ' · ' : ''}${plot.tower ?? ''}` : ''}</td>
                    <td>{renderStatusBadge(plot.status)}</td>
                    <td>{formatDateTime(normalizeDateValue(plot.statusUpdatedAt) ? plot.statusUpdatedAt : plot.submittedDate)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-secondary" onClick={() => navigate(`/v/${plot.layoutSlug}?plotId=${plot.id}`)}>
                        View Plot
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
        {savedPlotDetails.length === 0 ? (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedPlotDetails.map((plot) => (
                  <tr key={plot.id}>
                    <td>{plot.layoutName}</td>
                    <td>{plot.number}</td>
                    <td>{plot.areaCent} Cent</td>
                    <td>{plot.facing || 'N/A'}</td>
                    <td>{formatPrice(plot.estimatedPrice)}</td>
                    <td><span className={`status-${(plot.status || 'available').toLowerCase()}`}>{plot.status || 'Available'}</span></td>
                    <td>
                      <button className="btn-secondary" onClick={() => navigate(`/v/${plot.layoutSlug}?plotId=${plot.id}`)} style={{ marginRight: '0.5rem' }}>
                        View Plot
                      </button>
                      <button className="btn-danger" onClick={() => handleRemoveSavedPlot(plot.id)}>
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
