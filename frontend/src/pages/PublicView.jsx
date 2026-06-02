import { useParams } from 'react-router-dom'
import { useGetLayoutBySlugQuery } from '../api/apiSlice'
import PublicPlotMapView from './PublicPlotMapView'
import PublicBuildingView from './PublicBuildingView'
import { DEMO_PUBLIC_LAYOUT } from '../data/demoPublicLayout'

export default function PublicView() {
  const { slug } = useParams()
  const isDemo = slug === 'demo'
  
  const { data: fetchedLayout, isLoading: loading } = useGetLayoutBySlugQuery(slug, {
    skip: isDemo,
  })

  const layout = isDemo ? DEMO_PUBLIC_LAYOUT : fetchedLayout

  if (loading) return <div className="app-loading">Loading...</div>
  if (!layout) return <div className="app-loading">Layout not found.</div>
  if (layout.layoutKind === 'building') return <PublicBuildingView layout={layout} />
  return <PublicPlotMapView layout={layout} />
}
