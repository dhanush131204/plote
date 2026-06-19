import { useMemo } from 'react'
import { useGetAdminActivityQuery, useGetAdminLeadsQuery, useGetLayoutsQuery } from '../api/apiSlice'
import useSubscriptionDashboard from '../hooks/useSubscriptionDashboard'
import UpgradePrompt from '../components/subscription/UpgradePrompt'
import { SkeletonInsights } from '../components/SkeletonLoaders'

export default function Insights() {
  const { subscription, isLoading: subscriptionLoading } = useSubscriptionDashboard()
  const analyticsLocked = !subscription.hasAnalytics
  const { data: layouts = [], isLoading: layoutsLoading } = useGetLayoutsQuery(undefined, { skip: analyticsLocked })
  const { data: leadsData, isLoading: leadsLoading } = useGetAdminLeadsQuery(100, { skip: analyticsLocked })
  const { data: activityData, isLoading: activityLoading } = useGetAdminActivityQuery(200, { skip: analyticsLocked })

  const loading = subscriptionLoading || layoutsLoading || leadsLoading || activityLoading
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

  if (loading) return <SkeletonInsights />

  return (
    <div className="dashboard-container">
      <div className="dashboard-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem'}}>Insights</h1>
          <p style={{color: 'var(--color-text-muted)'}}>Understand project demand, buyer activity, and lead movement.</p>
        </div>
      </div>

      <section className="premium-kpi-grid">
        <div className="premium-stat-card">
          <div className="premium-stat-header">
            <span>Total Activity</span>
          </div>
          <div className="premium-stat-value">{events.length}</div>
          <div><span className="premium-stat-trend neutral">Interactions</span></div>
        </div>
        <div className="premium-stat-card">
          <div className="premium-stat-header">
            <span>Most Active Project</span>
          </div>
          <div className="premium-stat-value" style={{fontSize: '1.5rem', marginTop: '0.5rem'}}>{projectStats[0]?.name || 'No activity yet'}</div>
          <div><span className="premium-stat-trend positive">{projectStats[0] ? `${projectStats[0].views} views` : 'N/A'}</span></div>
        </div>
        <div className="premium-stat-card">
          <div className="premium-stat-header">
            <span>Conversion Signal</span>
          </div>
          <div className="premium-stat-value">{events.length ? `${Math.round((leads.length / Math.max(events.length, 1)) * 100)}%` : '0%'}</div>
          <div><span className="premium-stat-trend neutral">Enquiries vs. views</span></div>
        </div>
        <div className="premium-stat-card">
          <div className="premium-stat-header">
            <span>Inventory Ready</span>
          </div>
          <div className="premium-stat-value" style={{color: 'var(--color-available)'}}>{projectStats.reduce((sum, item) => sum + item.available, 0)}</div>
          <div><span className="premium-stat-trend neutral">Units Available</span></div>
        </div>
      </section>

      <section className="projects-section">
        <div className="section-header">
          <h2 className="section-title">Project engagement</h2>
        </div>
        <div className="admin-table-wrap" style={{background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--color-border)'}}>
          <table className="admin-table" style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: 'var(--color-bg-wash)'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Project</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Type</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Views</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Selections</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Leads</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--color-text-muted)'}}>Available</th>
              </tr>
            </thead>
            <tbody>
              {projectStats.map((item) => (
                <tr key={item.id} style={{borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', transition: 'background 0.2s'}}>
                  <td style={{padding: '1rem', fontWeight: '600'}}>{item.name}</td>
                  <td style={{padding: '1rem'}}><span className="project-badge">{item.type}</span></td>
                  <td style={{padding: '1rem'}}>{item.views}</td>
                  <td style={{padding: '1rem'}}>{item.selections}</td>
                  <td style={{padding: '1rem', fontWeight: '600', color: 'var(--color-accent)'}}>{item.leads}</td>
                  <td style={{padding: '1rem', fontWeight: '600', color: 'var(--color-available)'}}>{item.available}</td>
                </tr>
              ))}
              {projectStats.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No projects available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
