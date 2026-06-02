import { useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import ZoomResetEffect from './ZoomResetEffect'

export default function ImagePlotMapView({
  imageSrc,
  overlayConfig = {},
  plots = [],
  selectedPlot,
  onSelectPlot,
  calibrateMode = false,
  onCalibrateComplete,
  calibratePlotNum,
  onCalibratePlotNumChange,
  emptyMessage = 'No plots. Add plots in the builder.',
  detailsSlot,
  /** 'left' | 'right' — public view uses left sidebar */
  detailsSide = 'right',
  /** Rendered above the map (outside zoom), e.g. floor stack + 3D preview */
  beforeMapSlot = null,
  zoomPanEnabled = false,
  resetZoomTrigger = 0,
  zoomInTrigger = 0,
  zoomOutTrigger = 0,
}) {
  const hasPlots = plots && plots.length > 0
  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 10)
  const [calibPoints, setCalibPoints] = useState([])

  const handleImageLoad = (e) => {
    const img = e.target
    if (img?.naturalWidth && img?.naturalHeight) {
      setImageAspectRatio(img.naturalWidth / img.naturalHeight)
    }
  }

  const handleContainerClick = (e) => {
    if (!calibrateMode || !onCalibrateComplete) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2))
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2))
    const pt = [x, y]
    setCalibPoints((prev) => {
      const next = [...prev, pt]
      if (next.length === 4) {
        onCalibrateComplete(calibratePlotNum, next)
        return []
      }
      return next
    })
  }

  const getPlotOverlay = (plot) => {
    const config = overlayConfig[plot.number]
    if (config?.points?.length) {
      return { type: 'polygon', points: config.points }
    }
    return {
      type: 'rect',
      left: plot.left ?? 0,
      top: plot.top ?? 0,
      width: plot.width ?? 10,
      height: plot.height ?? 10,
      rotation: plot.rotation ?? 0,
    }
  }

  const useZoomLayout = zoomPanEnabled || calibrateMode

  const mapContainer = (
    <div
      className={`image-plot-map-container ${calibrateMode ? 'calibrate-mode' : ''} ${useZoomLayout ? 'image-plot-map-container--zoom' : ''}`}
      style={useZoomLayout ? { width: '100%', height: '100%' } : { aspectRatio: imageAspectRatio }}
      onClick={handleContainerClick}
      role={calibrateMode ? 'button' : undefined}
      tabIndex={calibrateMode ? 0 : undefined}
      onKeyDown={
        calibrateMode
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
              }
            }
          : undefined
      }
    >
      {imageSrc && (
        <img src={imageSrc} alt="Plot layout" className="image-plot-map-img" onLoad={handleImageLoad} />
      )}
      <svg
        className="image-plot-map-overlay-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ pointerEvents: calibrateMode ? 'none' : undefined }}
      >
        {/* In calibrate mode: show already-calibrated polygons so user sees marked plots */}
        {calibrateMode &&
          Object.entries(overlayConfig || {}).map(([plotNumStr, config]) => {
            const pts = config?.points
            if (!pts?.length) return null
            const plot = plots.find((p) => String(p.number) === String(plotNumStr))
            const isActive = selectedPlot && String(selectedPlot.number) === String(plotNumStr)
            const ptsStr = pts.map(([x, y]) => `${x},${y}`).join(' ')
            return (
              <polygon
                key={`calib-${plotNumStr}`}
                className={`image-plot-overlay-shape image-plot-overlay-calibrated status-${(plot?.status || 'available').toLowerCase()} ${isActive ? 'selected' : ''}`}
                points={ptsStr}
                style={{ pointerEvents: 'none' }}
              />
            )
          })}
        {hasPlots &&
          !calibrateMode &&
          plots.map((plot) => {
            const overlay = getPlotOverlay(plot)
            const isSelected = selectedPlot?.id === plot.id

            if (overlay.type === 'polygon') {
              const pts = overlay.points.map(([x, y]) => `${x},${y}`).join(' ')
              return (
                <polygon
                  key={plot.id}
                  className={`image-plot-overlay-shape status-${(plot.status || 'available').toLowerCase()} ${isSelected ? 'selected' : ''}`}
                  points={pts}
                  onClick={() => onSelectPlot?.(plot)}
                />
              )
            }
            const { left, top, width, height, rotation } = overlay
            const cx = left + width / 2
            const cy = top + height / 2
            return (
              <rect
                key={plot.id}
                className={`image-plot-overlay-shape status-${(plot.status || 'available').toLowerCase()} ${isSelected ? 'selected' : ''}`}
                x={left}
                y={top}
                width={width}
                height={height}
                transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : ''}
                onClick={() => onSelectPlot?.(plot)}
              />
            )
          })}
      </svg>
      {calibrateMode && calibPoints.length > 0 && (
        <svg
          className="image-plot-map-overlay-svg calib-markers"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ pointerEvents: 'none' }}
        >
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
      {calibrateMode && Object.keys(overlayConfig || {}).length > 0 && (
        <div className="image-plot-overlay-labels">
          {Object.entries(overlayConfig || {}).map(([plotNumStr, config]) => {
            const pts = config?.points
            if (!pts?.length) return null
            const cx = pts.reduce((s, [x]) => s + x, 0) / pts.length
            const cy = pts.reduce((s, [, y]) => s + y, 0) / pts.length
            return (
              <div
                key={`calib-label-${plotNumStr}`}
                className="overlay-label overlay-label-calibrated"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
              >
                {plotNumStr}
              </div>
            )
          })}
        </div>
      )}
      {hasPlots && !calibrateMode && (
        <div className="image-plot-overlay-labels">
          {plots.map((plot) => {
            const overlay = getPlotOverlay(plot)
            let cx
            let cy
            if (overlay.type === 'polygon' && overlay.points?.length) {
              cx = overlay.points.reduce((s, [x]) => s + x, 0) / overlay.points.length
              cy = overlay.points.reduce((s, [, y]) => s + y, 0) / overlay.points.length
            } else {
              cx = overlay.left + overlay.width / 2
              cy = overlay.top + overlay.height / 2
            }
            return (
              <div
                key={plot.id}
                className="overlay-label"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
              >
                {plot.number}
              </div>
            )
          })}
        </div>
      )}
      {!hasPlots && !calibrateMode && <div className="image-plot-overlay-empty">{emptyMessage}</div>}
    </div>
  )

  const mapBlock =
    useZoomLayout ? (
      <div className="image-plot-map-zoom-shell" style={{ aspectRatio: imageAspectRatio }}>
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          limitToBounds
          centerOnInit
          wheel={{ step: 0.12 }}
          doubleClick={{ disabled: false, mode: 'reset' }}
        >
          <ZoomResetEffect
            resetTrigger={resetZoomTrigger}
            zoomInTrigger={zoomInTrigger}
            zoomOutTrigger={zoomOutTrigger}
          />
          <TransformComponent wrapperClass="image-plot-map-zoom-wrapper" contentClass="image-plot-map-zoom-content">
            {mapContainer}
          </TransformComponent>
        </TransformWrapper>
      </div>
    ) : (
      mapContainer
    )

  const detailsEl = detailsSlot ? (
    <div className={`plot-details-side ${detailsSide === 'left' ? 'plot-details-side--left' : ''}`}>
      {typeof detailsSlot === 'function' ? detailsSlot({ calibPoints }) : detailsSlot}
    </div>
  ) : null

  return (
    <div
      className={`image-plot-map-layout ${calibrateMode ? 'calibrate-mode' : ''} ${detailsSide === 'left' ? 'details-side-left' : ''}`}
    >
      {detailsSide === 'left' && detailsEl}
      <div className={`image-plot-map-side ${calibrateMode ? 'calibrate-mode' : ''}`}>
        {beforeMapSlot}
        {mapBlock}
      </div>
      {detailsSide !== 'left' && detailsEl}
    </div>
  )
}
