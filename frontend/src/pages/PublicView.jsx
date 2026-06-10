import { useParams } from 'react-router-dom'
import { useGetLayoutBySlugQuery } from '../api/apiSlice'
import PublicPlotMapView from './PublicPlotMapView'
import PublicBuildingView from './PublicBuildingView'

export default function PublicView() {
  const { slug } = useParams()
  const { data: layout, isLoading: loading } = useGetLayoutBySlugQuery(slug)

  if (loading) return <div className="app-loading">Loading...</div>
  if (!layout) return <div className="app-loading">Layout not found.</div>
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
