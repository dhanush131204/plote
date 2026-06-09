import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery } from '../api/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ProjectsPage() {
  const { data: layouts = [], isLoading, error } = useGetLayoutsQuery();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    layoutKind: 'All', // 'Plot Map', 'Building', 'All'
    location: '', // New filter for projects
    sortBy: 'newest',
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      layoutKind: 'All',
      location: '',
      sortBy: 'newest',
    });
  };

  const filteredProjects = useMemo(() => {
    let filtered = layouts || [];

    if (filters.layoutKind !== 'All') {
      filtered = filtered.filter(p => (p.layoutKind === 'building' ? 'Building' : 'Plot Map') === filters.layoutKind);
    }

    if (filters.location) {
      const searchLower = filters.location.toLowerCase();
      filtered = filtered.filter(p => p.location?.toLowerCase().includes(searchLower) || p.name?.toLowerCase().includes(searchLower));
    }

    const sorted = [...filtered];
    if (filters.sortBy === 'available') {
      sorted.sort((a, b) => {
        const aAvailable = (a.availablePlots ?? (a.plots || []).filter((p) => String(p.status || '').toLowerCase() !== 'sold').length) || 0;
        const bAvailable = (b.availablePlots ?? (b.plots || []).filter((p) => String(p.status || '').toLowerCase() !== 'sold').length) || 0;
        return bAvailable - aAvailable;
      });
    } else if (filters.sortBy === 'priceLow') {
      sorted.sort((a, b) => {
        const aPrice = a.plots?.length > 0 ? Math.min(...a.plots.map((p) => p.estimatedPrice || Infinity)) : Infinity;
        const bPrice = b.plots?.length > 0 ? Math.min(...b.plots.map((p) => p.estimatedPrice || Infinity)) : Infinity;
        return aPrice - bPrice;
      });
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sorted;
  }, [layouts, filters]);

  if (isLoading) return <div className="app-loading">Loading projects...</div>;
  if (error) return <div className="dashboard-error">Error loading projects.</div>;

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="welcome-content">
          <p className="section-kicker">Interactive showroom</p>
          <h1 className="welcome-title">Explore</h1>
          <p className="welcome-subtitle">Browse available plot maps and building layouts with live inventory details.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{(layouts || []).length}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>
      </section>

      <section className="explore-toolbar">
        <input
          type="text"
          placeholder="Search location or project name"
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="builder-input builder-input-block explore-toolbar-input"
        />

        <div className="explore-filter-chips">
          {['All', 'Plot Map', 'Building'].map((type) => (
            <button
              key={type}
              type="button"
              className={`filter-chip ${filters.layoutKind === type ? 'active' : ''}`}
              onClick={() => handleFilterChange('layoutKind', type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="explore-toolbar-controls">
          <label className="sort-label">
            Sort by
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest</option>
              <option value="available">Most Available</option>
              <option value="priceLow">Price: Low to High</option>
            </select>
          </label>
          <button type="button" className="btn-secondary reset-filters-button" onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      </section>

      {filteredProjects.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-illustration">🔍</div>
          <h3>No projects found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((layout) => {
            const isBuilding = layout.layoutKind === 'building';
            const plots = layout.plots || [];

            const totalPlots = layout.totalPlots ?? plots.length;
            const availablePlots = layout.availablePlots ?? plots.filter((p) => String(p.status || '').toLowerCase() !== 'sold').length;
            const soldPlots = layout.soldPlots ?? plots.filter((p) => String(p.status || '').toLowerCase() === 'sold').length;
            const startingPrice = layout.plots?.length > 0
              ? Math.min(...layout.plots.map((p) => p.estimatedPrice || Infinity))
              : null;

            const formatPrice = (num) =>
              new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

            return (
              <div key={layout.id} className="project-card">
                <div className="project-card-image">
                  {layout.imagePath ? (
                    <img src={`${API_BASE}/uploads/${layout.imagePath}`} alt={layout.name} loading="lazy" />
                  ) : (
                    <div className="project-card-placeholder">No Image</div>
                  )}
                  <span className="project-badge">{isBuilding ? 'Building' : 'Plot Map'}</span>
                </div>
                <div className="project-card-content">
                  <div className="project-card-header">
                    <h3 className="project-title">{layout.name}</h3>
                    <span className="project-location">{layout.location || 'Location not set'}</span>
                  </div>
                  <div className="project-meta">
                    <span className="project-meta-item">Total {isBuilding ? 'Units' : 'Plots'}: {totalPlots}</span>
                    <span className="project-meta-item project-meta-highlight">Available: {availablePlots}</span>
                    <span className="project-meta-item project-meta-muted">Sold: {soldPlots}</span>
                    {startingPrice != null && startingPrice !== Infinity && (
                      <span className="project-meta-item project-starting-price">Starting from: {formatPrice(startingPrice)}</span>
                    )}
                  </div>
                  <div className="project-card-actions">
                    <button className="btn-primary" onClick={() => navigate(`/v/${layout.slug}`)}>
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
