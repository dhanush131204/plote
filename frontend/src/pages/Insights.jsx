import { useMemo } from 'react'
import { useGetAdminActivityQuery, useGetAdminLeadsQuery, useGetLayoutsQuery } from '../api/apiSlice'

export default function Insights() {
  const { data: layouts = [], isLoading: layoutsLoading } = useGetLayoutsQuery()
  const { data: leadsData, isLoading: leadsLoading } = useGetAdminLeadsQuery(100)
  const { data: activityData, isLoading: activityLoading } = useGetAdminActivityQuery(200)

  const loading = layoutsLoading || leadsLoading || activityLoading
  const leads = leadsData?.leads || []
  const events = activityData?.events || []

  const projectStats = useMemo(() => {
    return layouts.map((layout) => {
      const projectEvents = events.filter((event) => String(event.layoutId) === String(layout.id))
      const projectLeads = leads.filter((lead) => String(lead.layoutId) === String(layout.id))
      const plots = layout.plots || []
      return {
        id: layout.id,
        name: layout.name,
        slug: layout.slug,
        type: layout.layoutKind === 'building' ? 'Building' : 'Plot Map',
        views: projectEvents.filter((event) => event.eventType === 'page_view').length,
        selections: projectEvents.filter((event) => event.eventType === 'plot_select').length,
        leads: projectLeads.length,
        available: plots.filter((plot) => (plot.status || 'Available').toLowerCase() === 'available').length,
      }
    }).sort((a, b) => (b.views + b.selections + b.leads) - (a.views + a.selections + a.leads))
  }, [layouts, events, leads])

  if (loading) return <div className="app-loading">Loading insights...</div>

  return (
    <div className="dashboard-container">
      <section className="welcome-banner">
        <div className="welcome-content">
          <p className="section-kicker">Performance</p>
          <h1 className="welcome-title">Insights</h1>
          <p className="welcome-subtitle">Understand project demand, buyer activity, and lead movement.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{events.length}</span>
            <span className="stat-label">Activity</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{leads.length}</span>
            <span className="stat-label">Leads</span>
          </div>
        </div>
      </section>

      <section className="insight-grid">
        <div className="insight-card">
          <span className="insight-label">Most active project</span>
          <strong>{projectStats[0]?.name || 'No activity yet'}</strong>
          <p>{projectStats[0] ? `${projectStats[0].views} views, ${projectStats[0].selections} selections` : 'Share a public project link to start collecting activity.'}</p>
        </div>
        <div className="insight-card">
          <span className="insight-label">Lead conversion signal</span>
          <strong>{events.length ? `${Math.round((leads.length / Math.max(events.length, 1)) * 100)}%` : '0%'}</strong>
          <p>Ratio of enquiries to tracked interactions.</p>
        </div>
        <div className="insight-card">
          <span className="insight-label">Inventory ready</span>
          <strong>{projectStats.reduce((sum, item) => sum + item.available, 0)}</strong>
          <p>Available plots or units currently visible to buyers.</p>
        </div>
      </section>

      <section className="projects-section">
        <div className="section-header">
          <h2 className="section-title">Project engagement</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Type</th>
                <th>Views</th>
                <th>Selections</th>
                <th>Leads</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {projectStats.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.views}</td>
                  <td>{item.selections}</td>
                  <td>{item.leads}</td>
                  <td>{item.available}</td>
                </tr>
              ))}
              {projectStats.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No projects available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
