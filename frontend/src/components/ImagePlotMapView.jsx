import { useState, useEffect, useCallback, useRef } from 'react'
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
  detailsSide = 'right',
  detailsWidth,
  beforeMapSlot = null,
  zoomPanEnabled = false,
  resetZoomTrigger = 0,
  zoomInTrigger = 0,
  zoomOutTrigger = 0,
  storageKey,
  onHoverPlot,
}) {
  const hasPlots = plots && plots.length > 0
  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 10)
  const [calibPoints, setCalibPoints] = useState([])
  const [hoveredPlotState, setHoveredPlotState] = useState(null)
  const [hoverCoords, setHoverCoords] = useState({ x: 0, y: 0 })

  const formatPrice = (price) => {
    if (!price || price <= 0) return 'Contact for Price'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  let initialScale = 1
  let initialPositionX = 0
  let initialPositionY = 0
  const hasSavedState = !!(storageKey && sessionStorage.getItem(storageKey))
  if (hasSavedState) {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(storageKey))
      initialScale = parsed.scale ?? 1
      initialPositionX = parsed.positionX ?? 0
      initialPositionY = parsed.positionY ?? 0
    } catch (e) {}
  }

  const handleTransform = (ref) => {
    if (!storageKey) return
    const { scale, positionX, positionY } = ref.state
    const data = JSON.stringify({ scale, positionX, positionY })
    sessionStorage.setItem(storageKey, data)
  }

  // Resizable sidebar state
  const initialWidth = parseInt(detailsWidth) || 400
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const startResize = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      
      let newWidth
      if (detailsSide === 'left') {
        newWidth = e.clientX - containerRect.left
      } else {
        newWidth = containerRect.right - e.clientX
      }
      
      if (newWidth < 300) newWidth = 300
      const maxWidth = containerRect.width * 0.6 // max 60% of container
      if (newWidth > maxWidth) newWidth = maxWidth
      
      setSidebarWidth(newWidth)
    }
    const handleMouseUp = () => setIsDragging(false)
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, detailsSide])

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
    const next = [...calibPoints, pt]
    if (next.length === 4) {
      setCalibPoints([])
      onCalibrateComplete?.(calibratePlotNum, next)
    } else {
      setCalibPoints(next)
    }
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
      style={{ aspectRatio: imageAspectRatio, position: 'relative', width: '100%' }}
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
        <img 
          src={imageSrc} 
          alt="Plot layout" 
          className="image-plot-map-img" 
          onLoad={handleImageLoad} 
        />
      )}
      <svg
        className="image-plot-map-overlay-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ pointerEvents: calibrateMode ? 'none' : undefined, position: 'absolute', inset: 0, width: '100%', height: '100%' }}
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
                  onMouseEnter={(e) => {
                    setHoveredPlotState(plot)
                    setHoverCoords({ x: e.clientX, y: e.clientY })
                    onHoverPlot?.(plot, e)
                  }}
                  onMouseMove={(e) => {
                    setHoverCoords({ x: e.clientX, y: e.clientY })
                  }}
                  onMouseLeave={() => {
                    setHoveredPlotState(null)
                    onHoverPlot?.(null)
                  }}
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
                onMouseEnter={(e) => {
                  setHoveredPlotState(plot)
                  setHoverCoords({ x: e.clientX, y: e.clientY })
                  onHoverPlot?.(plot, e)
                }}
                onMouseMove={(e) => {
                  setHoverCoords({ x: e.clientX, y: e.clientY })
                }}
                onMouseLeave={() => {
                  setHoveredPlotState(null)
                  onHoverPlot?.(null)
                }}
              />
            )
          })}
      </svg>
      {calibrateMode && calibPoints.length > 0 && (
        <svg
          className="image-plot-map-overlay-svg calib-markers"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ pointerEvents: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%' }}
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
            const cx = pts.reduce((s, [x]) => s + x, 0) / pts.length
            const cy = pts.reduce((s, [, y]) => s + y, 0) / pts.length
            const plot = plots.find((p) => String(p.number) === String(plotNumStr) || String(p.id) === String(plotNumStr))
            const prefix = plot?.prefix !== undefined ? plot?.prefix : 'Unit'
            const displayName = prefix === 'Unit' ? plotNumStr : `${prefix} ${plotNumStr}`
            return (
              <div
                key={`calib-label-${plotNumStr}`}
                className="overlay-label overlay-label-calibrated"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
              >
                {displayName}
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
            const prefix = plot?.prefix !== undefined ? plot?.prefix : 'Unit'
            const displayName = prefix === 'Unit' ? plot.number : `${prefix} ${plot.number}`
            return (
              <div
                key={plot.id}
                className="overlay-label"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
              >
                {displayName}
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
      <div className="image-plot-map-zoom-shell" style={{ width: '100%', height: '100%', display: 'flex' }}>
        <TransformWrapper
          key={storageKey || 'map-zoom'}
          initialScale={initialScale}
          initialPositionX={initialPositionX}
          initialPositionY={initialPositionY}
          minScale={0.5}
          maxScale={3}
          limitToBounds={false}
          centerOnInit={!hasSavedState}
          onTransformed={handleTransform}
          wheel={{ step: 0.12 }}
          panning={{ disabled: false, wheelPanning: true }}
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
    <div 
      className={`plot-details-side ${detailsSide === 'left' ? 'plot-details-side--left' : ''}`}
      style={{ width: sidebarWidth, minWidth: sidebarWidth }}
    >
      {typeof detailsSlot === 'function' ? detailsSlot({ calibPoints }) : detailsSlot}
    </div>
  ) : null

  return (
    <div
      ref={containerRef}
      className={`image-plot-map-layout ${calibrateMode ? 'calibrate-mode' : ''} ${detailsSide === 'left' ? 'details-side-left' : ''}`}
      style={{ height: '100%', ...(isDragging ? { cursor: 'col-resize', userSelect: 'none' } : {}) }}
    >
      {detailsSide === 'left' && detailsEl}
      
      {detailsSide === 'left' && detailsSlot && (
        <div className="image-plot-map-resizer" onMouseDown={startResize} />
      )}
      
      <div className={`image-plot-map-side ${calibrateMode ? 'calibrate-mode' : ''}`} style={isDragging ? { pointerEvents: 'none' } : {}}>
        {beforeMapSlot}
        {mapBlock}
      </div>

      {detailsSide !== 'left' && detailsSlot && (
        <div className="image-plot-map-resizer" onMouseDown={startResize} />
      )}

      {detailsSide !== 'left' && detailsEl}

      {hoveredPlotState && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverCoords.x}px`,
            top: `${hoverCoords.y - 12}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            minWidth: '160px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
              Unit {hoveredPlotState.number}
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '10px',
                textTransform: 'uppercase',
                background: hoveredPlotState.status?.toLowerCase() === 'available' ? '#ecfdf5' : (hoveredPlotState.status?.toLowerCase() === 'booked' ? '#fffbeb' : '#fef2f2'),
                color: hoveredPlotState.status?.toLowerCase() === 'available' ? '#10b981' : (hoveredPlotState.status?.toLowerCase() === 'booked' ? '#f59e0b' : '#ef4444')
              }}
            >
              {hoveredPlotState.status || 'Available'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ color: '#94a3b8' }}>Beds:</span>
            <span>{hoveredPlotState.beds ? `${hoveredPlotState.beds} BHK` : hoveredPlotState.label || 'Apartment'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ color: '#94a3b8' }}>Price:</span>
            <span style={{ color: '#10b981' }}>
              {formatPrice(hoveredPlotState.estimatedPrice || (hoveredPlotState.areaSqft * hoveredPlotState.pricePerSqft) || hoveredPlotState.price)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
