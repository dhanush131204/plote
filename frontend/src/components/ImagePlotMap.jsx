import { useMemo, useState } from 'react'
import PlotDetailsPanel from './PlotDetailsPanel'
import { overlayCoordinates } from '../data/overlayConfig'
import { plotsData } from '../data/plots'

export default function ImagePlotMap({ plots, selectedPlot, onSelectPlot }) {
  const hasPlots = plots && plots.length > 0
  const calibrateMode = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('calibrate') === '1',
    []
  )
  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 10)
  const [calibPoints, setCalibPoints] = useState([])
  const [calibPlotNum, setCalibPlotNum] = useState(101)

  const handleImageLoad = (e) => {
    const img = e.target
    if (img.naturalWidth && img.naturalHeight) {
      setImageAspectRatio(img.naturalWidth / img.naturalHeight)
    }
  }

  const handleContainerClick = (e) => {
    if (!calibrateMode) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const pt = [Number(x.toFixed(2)), Number(y.toFixed(2))]
    setCalibPoints((prev) => {
      const next = [...prev, pt]
      if (next.length === 4) {
        const line = `  ${calibPlotNum}: { points: [${next.map(([a, b]) => `[${a}, ${b}]`).join(', ')}] },`
        console.log(line)
        navigator.clipboard?.writeText?.(line)
      }
      return next.length < 4 ? next : []
    })
  }

  const getPlotOverlay = (plot) => {
    const config = overlayCoordinates[plot.number]
    if (config?.points) {
      const pts = config.points
      return { type: 'polygon', points: pts }
    }
    // Fallback to rect from plot data
    return {
      type: 'rect',
      left: plot.left ?? 0,
      top: plot.top ?? 0,
      width: plot.width ?? 10,
      height: plot.height ?? 10,
      rotation: plot.rotation ?? 0,
    }
  }

  return (
    <div className="image-plot-map-layout">
      <div className="image-plot-map-side">
        <div
          className={`image-plot-map-container ${calibrateMode ? 'calibrate-mode' : ''}`}
          style={{ aspectRatio: imageAspectRatio }}
          onClick={handleContainerClick}
          role={calibrateMode ? 'button' : undefined}
          tabIndex={calibrateMode ? 0 : undefined}
        >
          <img
            src="/plot-image.png"
            alt="Plot layout - Bhuvaneshwari Nagar"
            className="image-plot-map-img"
            onLoad={handleImageLoad}
          />
          <svg
            className="image-plot-map-overlay-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ pointerEvents: calibrateMode ? 'none' : undefined }}
          >
            {hasPlots && !calibrateMode &&
              plots.map((plot) => {
                const overlay = getPlotOverlay(plot)
                const isSelected = selectedPlot?.id === plot.id

                if (overlay.type === 'polygon') {
                  const pts = overlay.points
                    .map(([x, y]) => `${x},${y}`)
                    .join(' ')
                  return (
                    <polygon
                      key={plot.id}
                      className={`image-plot-overlay-shape status-${plot.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                      points={pts}
                      onClick={() => onSelectPlot(plot)}
                    >
                      <title>{`Plot #${plot.number} - ${plot.status}`}</title>
                    </polygon>
                  )
                }

                // Rect with optional rotation
                const { left, top, width, height, rotation } = overlay
                const cx = left + width / 2
                const cy = top + height / 2
                const transform = rotation
                  ? `rotate(${rotation} ${cx} ${cy})`
                  : ''

                return (
                  <rect
                    key={plot.id}
                    className={`image-plot-overlay-shape status-${plot.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                    x={left}
                    y={top}
                    width={width}
                    height={height}
                    transform={transform}
                    onClick={() => onSelectPlot(plot)}
                  >
                    <title>{`Plot #${plot.number} - ${plot.status}`}</title>
                  </rect>
                )
              })}
          </svg>
          {calibrateMode && calibPoints.length > 0 && (
            <svg className="image-plot-map-overlay-svg calib-markers" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
              <polygon
                points={calibPoints.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="rgba(34,197,94,0.2)"
                stroke="rgba(34,197,94,0.9)"
                strokeWidth="1"
              />
              {calibPoints.map((pt, i) => (
                <circle key={i} cx={pt[0]} cy={pt[1]} r="1" fill="white" stroke="#22c55e" strokeWidth="0.5" />
              ))}
            </svg>
          )}
        </div>
        {calibrateMode && (
          <div className="calibration-panel">
            <p>Click plot {calibPlotNum}&apos;s 4 corners: top-left → top-right → bottom-right → bottom-left</p>
            <p>Points: {calibPoints.length}/4</p>
            <select value={calibPlotNum} onChange={(e) => { setCalibPlotNum(Number(e.target.value)); setCalibPoints([]) }}>
              {plotsData.map((p) => (
                <option key={p.id} value={p.number}>{p.number}</option>
              ))}
            </select>
            {calibPoints.length === 4 && (
              <button type="button" onClick={() => setCalibPoints([])}>Next plot</button>
            )}
          </div>
        )}
        {hasPlots && !calibrateMode && (
          <div className="image-plot-overlay-labels">
            {plots.map((plot) => {
              const overlay = getPlotOverlay(plot)
              let cx, cy
              if (overlay.type === 'polygon' && overlay.points?.length) {
                const pts = overlay.points
                cx = pts.reduce((s, [x]) => s + x, 0) / pts.length
                cy = pts.reduce((s, [, y]) => s + y, 0) / pts.length
              } else {
                cx = overlay.left + overlay.width / 2
                cy = overlay.top + overlay.height / 2
              }
              return (
                <div
                  key={plot.id}
                  className="overlay-label"
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {plot.number}
                </div>
              )
            })}
          </div>
        )}
        {!hasPlots && (
          <div className="image-plot-overlay-empty">
            No plots match your filters. Try adjusting the filters.
          </div>
        )}
      </div>
      <div className="plot-details-side">
        <PlotDetailsPanel plot={selectedPlot} />
      </div>
    </div>
  )
}
