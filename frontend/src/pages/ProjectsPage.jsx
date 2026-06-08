import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLayoutsQuery } from '../api/apiSlice';
import Filters from '../components/Filters'; // Assuming Filters can be reused or adapted
import { useAuth } from '../contexts/AuthContext'; // Import useAuth to check isAdmin

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ProjectsPage() {
  const { data: layouts = [], isLoading, error } = useGetLayoutsQuery();
  const { isAdmin } = useAuth(); // Get isAdmin status
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      console.log(`[ProjectsPage] Projects from API (Role: ${isAdmin ? 'Admin' : 'Buyer'}):`, layouts);
      console.log(`[ProjectsPage] Projects Count: ${layouts.length}`);
    }
  }, [layouts, isLoading]);

  const [filters, setFilters] = useState({
    layoutKind: 'All', // 'Plot Map', 'Building', 'All'
    location: '', // New filter for projects
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      layoutKind: 'All',
      location: '',
    });
  };

  const filteredProjects = useMemo(() => {
    let filtered = layouts;

    if (filters.layoutKind !== 'All') {
      filtered = filtered.filter(p => (p.layoutKind === 'building' ? 'Building' : 'Plot Map') === filters.layoutKind);
    }

    if (filters.location) {
      const searchLower = filters.location.toLowerCase();
      filtered = filtered.filter(p => p.location?.toLowerCase().includes(searchLower) || p.name?.toLowerCase().includes(searchLower));
    }

    return filtered;
  }, [layouts, filters]);

  if (isLoading) return <div className="app-loading">Loading projects...</div>;
  if (error) return <div className="dashboard-error">Error loading projects.</div>;

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <h1 className="welcome-title">All Projects</h1>
          <p className="welcome-subtitle">Browse all available plot maps and building layouts.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{layouts.length}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>
      </section>

      <div className="projects-page-content" style={{ display: 'flex', gap: '2rem' }}>
        <aside className="projects-filter-sidebar" style={{ flexShrink: 0, width: '250px', padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
          <h3 className="filters-title" style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>Project Filters</h3>
          <div className="filter-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Search Location/Name</label>
            <input
              type="text"
              placeholder="e.g., Bangalore, Phase 1"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="builder-input builder-input-block"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div className="filter-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Type</label>
            <div className="filter-pill-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['All', 'Plot Map', 'Building'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`filter-pill ${filters.layoutKind === type ? 'active' : ''}`}
                  onClick={() => handleFilterChange('layoutKind', type)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--color-border)', background: 'var(--color-bg-wash)', cursor: 'pointer', transition: 'all 0.2s ease', ...(filters.layoutKind === type && { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }) }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="filters-reset btn-secondary" onClick={handleResetFilters} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-wash)', cursor: 'pointer' }}>
            Reset Filters
          </button>
        </aside>

        <main className="projects-list-main" style={{ flexGrow: 1 }}>
          {filteredProjects.length === 0 ? (
            <div className="empty-state-premium">
              <div className="empty-illustration">🔍</div>
              <h3>No projects found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredProjects.map((layout) => {
                const isBuilding = layout.layoutKind === 'building';
                const plots = layout.plots || [];
                
                // Calculate statistics dynamically
                const totalPlots = layout.totalPlots ?? plots.length;
                const availablePlots = layout.availablePlots ?? plots.filter(p => p.status?.toLowerCase() === "available").length;
                const soldPlots = layout.soldPlots ?? plots.filter(p => p.status?.toLowerCase() === "sold").length;

                const startingPrice = layout.plots?.length > 0
                  ? Math.min(...layout.plots.map(p => p.estimatedPrice || Infinity))
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
                      <h3 className="project-title">{layout.name}</h3>
                      <div className="project-meta">
                        <span className="project-meta-item">📍 {layout.location || 'Location not set'}</span>
                        <div className="project-stats-summary" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <span className="project-meta-item">Total {isBuilding ? 'Units' : 'Plots'}: {totalPlots}</span>
                          <span className="project-meta-item" style={{ color: 'var(--color-available)' }}>
                            Available: {availablePlots}
                          </span>
                          <span className="project-meta-item" style={{ color: 'var(--color-danger)' }}>
                            Sold: {soldPlots}
                          </span>
                        </div>
                        {startingPrice != null && startingPrice !== Infinity && (
                          <span className="project-meta-item">
                            Starting from: {formatPrice(startingPrice)}
                          </span>
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
        </main>
      </div>
    </div>
  );
}