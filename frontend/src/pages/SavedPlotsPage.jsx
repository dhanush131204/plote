import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery } from '../api/apiSlice'; // To get full plot details

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function SavedPlotsPage() {
  const navigate = useNavigate();
  const { data: allLayouts = [], isLoading: loadingLayouts } = useGetLayoutsQuery();
  const [savedPlotIds, setSavedPlotIds] = useState([]); // Format: [{ layoutId: '...', plotId: '...' }]
  const [savedPlotsDetails, setSavedPlotsDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved plot IDs from local storage
    const storedSavedPlots = JSON.parse(localStorage.getItem('savedPlots') || '[]');
    setSavedPlotIds(storedSavedPlots);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (loadingLayouts || isLoading) return;

    const details = [];
    savedPlotIds.forEach(saved => {
      const layout = allLayouts.find(l => l.id === saved.layoutId);
      if (layout) {
        const plot = (layout.plots || []).find(p => p.id === saved.plotId);
        if (plot) {
          details.push({ ...plot, layoutName: layout.name, layoutSlug: layout.slug, layoutId: layout.id });
        }
      }
    });
    setSavedPlotsDetails(details);
  }, [savedPlotIds, allLayouts, loadingLayouts, isLoading]);

  const handleRemoveFromSaved = (layoutId, plotId) => {
    const updatedSavedPlots = savedPlotIds.filter(
      (saved) => !(saved.layoutId === layoutId && saved.plotId === plotId)
    );
    setSavedPlotIds(updatedSavedPlots);
    localStorage.setItem('savedPlots', JSON.stringify(updatedSavedPlots));
  };

  const formatPrice = (num) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

  if (isLoading || loadingLayouts) return <div className="app-loading">Loading saved plots...</div>;

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <h1 className="welcome-title">Saved Plots</h1>
          <p className="welcome-subtitle">Your wishlist of properties.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{savedPlotsDetails.length}</span>
            <span className="stat-label">Total Saved</span>
          </div>
        </div>
      </section>

      {savedPlotsDetails.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-illustration">⭐</div>
          <h3>No saved plots yet</h3>
          <p>Browse projects and save plots you're interested in to see them here.</p>
          <button className="btn-primary" onClick={() => navigate('/buyer/projects')}>Browse Projects</button>
        </div>
      ) : (
        <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}> {/* Reusing projects-grid for card layout */}
          {savedPlotsDetails.map((plot) => (
            <div key={`${plot.layoutId}-${plot.id}`} className="project-card"> {/* Reusing project-card styles */}
              <div className="project-card-content">
                <h3 className="project-title">Plot #{plot.number}</h3>
                <p className="project-meta-item">Project: {plot.layoutName}</p>
                <div className="project-meta">
                  <span className="project-meta-item">Area: {plot.areaCent} Cent ({plot.areaSqft?.toLocaleString()} sqft)</span>
                  <span className="project-meta-item">Facing: {plot.facing || 'N/A'}</span>
                  <span className={`project-meta-item status-${(plot.status || 'available').toLowerCase()}`}>Status: {plot.status || 'Available'}</span>
                  <span className="project-meta-item">Price: {formatPrice(plot.estimatedPrice)}</span>
                </div>
                <div className="project-card-actions">
                  <button className="btn-primary" onClick={() => navigate(`/v/${plot.layoutSlug}`)}>
                    View Project
                  </button>
                  <button
                    className="btn-secondary btn-danger"
                    onClick={() => handleRemoveFromSaved(plot.layoutId, plot.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}