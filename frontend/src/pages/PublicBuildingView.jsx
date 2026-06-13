import PremiumBuyerBuildingView from '../components/PremiumBuyerBuildingView'

export default function PublicBuildingView({ layout }) {
  if (!layout) return <div className="app-loading">Layout not found.</div>
  
  return <PremiumBuyerBuildingView layout={layout} />
}
