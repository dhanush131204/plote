import { useGetLayoutsQuery } from '../api/apiSlice';
import { useNavigate } from 'react-router-dom';
import { normalizeDateValue } from '../utils/dateUtils';

export default function GlobalProjects() {
  const { data: layouts, isLoading } = useGetLayoutsQuery();
  const navigate = useNavigate();

  const formatDate = (value) => {
    const normalized = normalizeDateValue(value);
    if (!normalized) return '—';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '—';
    return date.toLocaleDateString();
  };

  if (isLoading) return <div className="app-loading">Loading Global Projects...</div>;

  return (
    <div className="dashboard-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="welcome-title">Global Projects</h1>
          <p className="welcome-subtitle">All plot maps and buildings across all builders.</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr style={{ background: 'var(--color-bg-wash)' }}>
              <th>Company Name</th>
              <th>Project Name</th>
              <th>Type</th>
              <th>Created Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(layouts || []).map(layout => (
              <tr key={layout.id}>
                <td style={{ fontWeight: '600' }}>{layout.companyName || layout.builderName || 'Not Set'}</td>
                <td style={{ fontWeight: '600' }}>{layout.name}</td>
                <td>{layout.layoutKind === 'building' ? 'Building' : 'Plot Map'}</td>
                <td>{formatDate(layout.createdAt)}</td>
                <td><span className="status-available">Active</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-secondary" onClick={() => window.open(`/v/${layout.slug}`, '_blank')}>
                    View Public
                  </button>
                </td>
              </tr>
            ))}
            {(!layouts || layouts.length === 0) && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No projects found across the platform.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
