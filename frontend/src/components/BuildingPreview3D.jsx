import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'

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
      <Canvas camera={{ position: [2.2, 1.4, 2.4], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#0f1118']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 8, 3]} intensity={0.85} castShadow />
        <Stack floors={floors} selectedFloorId={selectedFloorId} onSelectFloor={onSelectFloor} />
        <OrbitControls enablePan={false} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
      <p className="building-preview-3d-hint">Orbit to view · Click a floor to select</p>
    </div>
  )
}
