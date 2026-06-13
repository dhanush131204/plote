import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'

class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  componentDidCatch(error, errorInfo) {
    console.error("3D Canvas error caught:", error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="building-preview-3d-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: '#0f1118', color: '#cbd5e1', padding: '1rem', textAlign: 'center', fontSize: '0.85rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>3D Preview Unavailable</p>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.75rem' }}>WebGL might be disabled or unsupported by your browser.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function FloorSlab({ y, selected, onPick, floorId }) {
  return (
    <mesh
      position={[0, y, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onPick(floorId)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      <boxGeometry args={[1.4, 0.2, 0.9]} />
      <meshStandardMaterial color={selected ? '#3b82f6' : '#6b7280'} metalness={0.2} roughness={0.65} />
    </mesh>
  )
}

function Stack({ floors, selectedFloorId, onSelectFloor }) {
  const sorted = useMemo(() => [...floors].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [floors])
  return (
    <group position={[0, -sorted.length * 0.11, 0]}>
      {sorted.map((f, i) => (
        <FloorSlab
          key={f.id}
          floorId={f.id}
          y={i * 0.22}
          selected={f.id === selectedFloorId}
          onPick={onSelectFloor}
        />
      ))}
    </group>
  )
}

export default function BuildingPreview3D({ floors = [], selectedFloorId, onSelectFloor }) {
  if (!floors.length) {
    return (
      <div className="building-preview-3d building-preview-3d--empty">
        <p>Add floors in the builder to see a stack preview.</p>
      </div>
    )
  }

  return (
    <div className="building-preview-3d">
      <CanvasErrorBoundary>
        <Canvas camera={{ position: [2.2, 1.4, 2.4], fov: 42 }} dpr={[1, 2]}>
          <color attach="background" args={['#0f1118']} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 8, 3]} intensity={0.85} castShadow />
          <Stack floors={floors} selectedFloorId={selectedFloorId} onSelectFloor={onSelectFloor} />
          <OrbitControls enablePan={false} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.05} />
        </Canvas>
      </CanvasErrorBoundary>
      <p className="building-preview-3d-hint">Orbit to view · Click a floor to select</p>
    </div>
  )
}
