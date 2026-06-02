import { useState } from 'react'
import PlotDetailsTooltip from './PlotDetailsTooltip'

export default function PlotMapTile({ plot }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`plot-map-tile status-${plot.status.toLowerCase()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="plot-map-tile-inner">
        <span className="plot-map-number">{plot.number}</span>

        {isHovered && (
          <div
            className="plot-tooltip-wrapper plot-map-tooltip"
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
