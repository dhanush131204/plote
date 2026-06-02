import { useEffect } from 'react'
import { useControls } from 'react-zoom-pan-pinch'

/** Trigger zoom controls from external state counters. */
export default function ZoomResetEffect({ resetTrigger, zoomInTrigger = 0, zoomOutTrigger = 0 }) {
  const { resetTransform, zoomIn, zoomOut } = useControls()

  useEffect(() => {
    if (resetTrigger === 0) return
    resetTransform(200)
  }, [resetTrigger, resetTransform])

  useEffect(() => {
    if (zoomInTrigger === 0) return
    zoomIn(0.35, 150)
  }, [zoomInTrigger, zoomIn])

  useEffect(() => {
    if (zoomOutTrigger === 0) return
    zoomOut(0.35, 150)
  }, [zoomOutTrigger, zoomOut])

  return null
}
