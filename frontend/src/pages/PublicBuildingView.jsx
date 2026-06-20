import PremiumBuyerBuildingView from '../components/PremiumBuyerBuildingView'
import { usePublicActivity } from '../hooks/usePublicActivity'

export default function PublicBuildingView({ layout }) {
  const { logPlotSelect } = usePublicActivity(layout?.id, layout?.layoutKind || 'building')

  if (!layout) return <div className="app-loading">Layout not found.</div>
  
  return <PremiumBuyerBuildingView layout={layout} onUnitSelect={logPlotSelect} />
}
