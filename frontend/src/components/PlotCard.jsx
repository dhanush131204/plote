import { useState } from 'react'
import PlotDetailsTooltip from './PlotDetailsTooltip'

export default function PlotCard({ plot }) {
  const [isHovered, setIsHovered] = useState(false)

  const formatPrice = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div
      className={`plot-card status-${plot.status.toLowerCase()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="plot-card-inner">
        <span className="plot-number">Plot #{plot.number}</span>
        <span className="plot-area">{plot.areaCent} cent</span>
        <span className="plot-facing">{plot.facing}</span>
        <span className="plot-status">{plot.status}</span>
        <span className="plot-price">{formatPrice(plot.estimatedPrice)}</span>

        {isHovered && (
          <div
            className="plot-tooltip-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <PlotDetailsTooltip plot={plot} />
          </div>
        )}
      </div>
    </div>
  )
}
