import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stage, Html } from '@react-three/drei'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div style={{ color: '#ef4444', fontWeight: 600, textAlign: 'center', background: 'rgba(255,255,255,0.9)', padding: '1rem', borderRadius: '8px' }}>
            Failed to load 3D Model.<br />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{this.state.error?.message || 'Unsupported format or corrupted file.'}</span>
          </div>
        </Html>
      )
    }
    return this.props.children
  }
}

function Model({ url, selectedFloorId, onSelectFloor }) {
  // Provide Draco decoder for compressed models
  const { scene } = useGLTF(url, 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  const ref = useRef()

  return <primitive object={scene} ref={ref} />
}

export default function Building3DViewer({ modelUrl, selectedFloorId, onSelectFloor }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#f8fafc' }}>
      <ErrorBoundary>
        <Canvas shadows camera={{ position: [0, 5, 15], fov: 45 }} fallback={<div>WebGL not supported.</div>}>
          <Suspense fallback={
            <Html center>
              <div style={{ color: '#64748b', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Loading 3D Model...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </Html>
          }>
            <Stage environment="city" intensity={0.5} adjustCamera>
              <Model url={modelUrl} selectedFloorId={selectedFloorId} onSelectFloor={onSelectFloor} />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault autoRotate={false} enablePan={true} enableZoom={true} />
        </Canvas>
      </ErrorBoundary>
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', pointerEvents: 'none', backdropFilter: 'blur(4px)' }}>
        Left Click: Rotate • Scroll: Zoom • Right Click: Pan
      </div>
    </div>
  )
}
