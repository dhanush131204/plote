import { useParams, useSearchParams } from 'react-router-dom'
import { useGetLayoutBySlugQuery } from '../api/apiSlice'
import PublicPlotMapView from './PublicPlotMapView'
import PublicBuildingView from './PublicBuildingView'
import { Lock } from 'lucide-react'

export default function PublicView() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const { data: layout, isLoading: loading, error } = useGetLayoutBySlugQuery({ slug, token })

  if (loading) return <div className="app-loading">Loading...</div>
  
  if (error?.status === 403) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <Lock size={64} color="#94a3b8" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '500px' }}>
          This layout is private. You need a valid sharing link with a secure token to view it. Please contact the builder for the correct link.
        </p>
      </div>
    )
  }

  if (error || !layout) return <div className="app-loading">Layout not found.</div>
  return (
    <div className="public-map-wrapper">
      {layout.layoutKind === 'building' ? (
        <PublicBuildingView layout={layout} />
      ) : (
        <PublicPlotMapView layout={layout} />
      )}
    </div>
  )
}
