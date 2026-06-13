import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function Custom3DWalkthrough({ rooms = [], defaultRoomId, onClose }) {
  const containerRef = useRef(null)
  const [currentRoomId, setCurrentRoomId] = useState(defaultRoomId || (rooms[0]?.id))
  
  // Find current room object
  const currentRoom = rooms.find(r => String(r.id) === String(currentRoomId)) || rooms[0]
  
  // Refs for three.js objects
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const textureLoaderRef = useRef(null)
  const sphereRef = useRef(null)
  
  // Interaction variables
  const isUserInteracting = useRef(false)
  const onPointerDownMouseX = useRef(0)
  const onPointerDownMouseY = useRef(0)
  const onPointerDownLon = useRef(0)
  const onPointerDownLat = useRef(0)
  const lon = useRef(0)
  const lat = useRef(0)
  const phi = useRef(0)
  const theta = useRef(0)

  // Initialize ThreeJS scene
  useEffect(() => {
    if (!containerRef.current) return

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera (field of view, aspect ratio, near, far)
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 1, 1100)
    camera.target = new THREE.Vector3(0, 0, 0)
    cameraRef.current = camera

    // Geometry
    const geometry = new THREE.SphereGeometry(500, 60, 40)
    // Invert the geometry on the x-axis so that all faces point inward
    geometry.scale(-1, 1, 1)

    // Material
    const textureLoader = new THREE.TextureLoader()
    textureLoader.setCrossOrigin('anonymous')
    textureLoaderRef.current = textureLoader
    
    // Use Basic material for panorama
    const material = new THREE.MeshBasicMaterial({ color: 0x111111 })
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)
    sphereRef.current = sphere

    // Renderer
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.top = '0'
      renderer.domElement.style.left = '0'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      
      // Prevent double canvases in StrictMode
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer
    } catch (e) {
      console.error("Failed to initialize WebGLRenderer:", e)
      containerRef.current.innerHTML = '<div style="color:white; padding: 2rem; text-align: center;">WebGL context could not be created. Please refresh the page.</div>'
      return
    }

    // Pointer events
    const onPointerDown = (event) => {
      isUserInteracting.current = true
      
      const clientX = event.clientX || event.touches?.[0]?.clientX
      const clientY = event.clientY || event.touches?.[0]?.clientY

      onPointerDownMouseX.current = clientX
      onPointerDownMouseY.current = clientY

      onPointerDownLon.current = lon.current
      onPointerDownLat.current = lat.current
    }

    const onPointerMove = (event) => {
      if (!isUserInteracting.current) return

      const clientX = event.clientX || event.touches?.[0]?.clientX
      const clientY = event.clientY || event.touches?.[0]?.clientY

      lon.current = (onPointerDownMouseX.current - clientX) * 0.1 + onPointerDownLon.current
      lat.current = (clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current
    }

    const onPointerUp = () => {
      isUserInteracting.current = false
    }

    const dom = renderer.domElement
    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('pointermove', onPointerMove)
    dom.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('touchstart', onPointerDown)
    dom.addEventListener('touchmove', onPointerMove)
    dom.addEventListener('touchend', onPointerUp)

    // Animation loop
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Clamp latitude to prevent flipping over poles
      lat.current = Math.max(-85, Math.min(85, lat.current))
      
      phi.current = THREE.MathUtils.degToRad(90 - lat.current)
      theta.current = THREE.MathUtils.degToRad(lon.current)

      const x = 500 * Math.sin(phi.current) * Math.cos(theta.current)
      const y = 500 * Math.cos(phi.current)
      const z = 500 * Math.sin(phi.current) * Math.sin(theta.current)

      camera.lookAt(x, y, z)
      renderer.render(scene, camera)
    }
    animate()

    // Resize observer for dynamic container sizing (fixes 0x0 canvas bug on load)
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (!rendererRef.current || !cameraRef.current) return
        const width = entry.contentRect.width
        const height = entry.contentRect.height
        if (width === 0 || height === 0) continue
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
      // Force initial size check
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      if (width > 0 && height > 0) {
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (resizeObserver) resizeObserver.disconnect()
      if (dom) {
        dom.removeEventListener('pointerdown', onPointerDown)
        dom.removeEventListener('pointermove', onPointerMove)
        dom.removeEventListener('pointerup', onPointerUp)
        dom.removeEventListener('touchstart', onPointerDown)
        dom.removeEventListener('touchmove', onPointerMove)
        dom.removeEventListener('touchend', onPointerUp)
      }
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
      // Properly dispose Three.js objects
      geometry.dispose()
      material.dispose()
      // Force webgl context loss to free up browser resources for hot reloading
      renderer.forceContextLoss()
      renderer.dispose()
    }
  }, [])

  // Handle texture switching when currentRoom changes
  useEffect(() => {
    if (!sphereRef.current || !textureLoaderRef.current || !currentRoom) return

    // Show loading texture or placeholder
    sphereRef.current.material.color.setHex(0x111111)

    // Clean up path to prevent double slashes (e.g., /uploads//uploads/...)
    let imageSrc = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80' // Default fallback
    if (currentRoom.imagePath) {
      if (currentRoom.imagePath.startsWith('http') || currentRoom.imagePath.startsWith('data:') || currentRoom.imagePath.startsWith('blob:')) {
        imageSrc = currentRoom.imagePath
      } else if (currentRoom.imagePath.startsWith('/uploads')) {
        imageSrc = `${import.meta.env.VITE_API_URL || ''}${currentRoom.imagePath}`
      } else {
        imageSrc = `${import.meta.env.VITE_API_URL || ''}/uploads/${currentRoom.imagePath}`
      }
    }

    const loadTexture = (src) => {
      textureLoaderRef.current.load(
        src, 
        (texture) => {
          if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace
            sphereRef.current.material.map = texture
            sphereRef.current.material.color.setHex(0xffffff)
            sphereRef.current.material.needsUpdate = true
          }
        },
        undefined,
        (err) => {
          console.error('Failed to load room panorama texture:', src, err)
          // If the custom image fails, fallback to a known working image
          const fallbackUrl = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80'
          if (src !== fallbackUrl) {
            console.log('Falling back to default 360 panorama...')
            loadTexture(fallbackUrl)
          } else {
            // Even fallback failed, just color it white so it's not black
            sphereRef.current.material.color.setHex(0xffffff)
            sphereRef.current.material.needsUpdate = true
          }
        }
      )
    }

    loadTexture(imageSrc)
  }, [currentRoom])

  // Clickable Navigation Hotspots in current room
  const roomHotspots = currentRoom?.hotspots || []

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000000',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Header / Control Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1.25rem 2rem',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2100,
        pointerEvents: 'none'
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            3D WALKTHROUGH
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', fontSize: '0.8rem', fontWeight: '500' }}>
            Currently in: <strong style={{ color: '#10b981' }}>{currentRoom?.name || 'Main Hall'}</strong>
          </p>
        </div>

        <button 
          onClick={onClose}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.25rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          title="Exit Walkthrough"
        >
          ×
        </button>
      </div>

      {/* Main 3D Sphere Container */}
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'grab', overflow: 'hidden' }} />

      {/* Room Jump Menu List (Top Left Overlay) */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        background: 'rgba(10, 20, 18, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '12px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '180px',
        zIndex: 2100
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>Rooms</div>
        {rooms.map(room => {
          const isActive = String(room.id) === String(currentRoomId)
          return (
            <button
              key={room.id}
              onClick={() => setCurrentRoomId(room.id)}
              style={{
                background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                color: isActive ? '#10b981' : 'rgba(255,255,255,0.7)',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
            >
              {room.name}
            </button>
          )
        })}
      </div>

      {/* Interactive Walkthrough Navigation Arrows (Hotspots Overlayed on screen coords) */}
      {roomHotspots.map((hotspot, idx) => {
        return (
          <button
            key={idx}
            onClick={() => setCurrentRoomId(hotspot.targetRoomId)}
            style={{
              position: 'absolute',
              left: hotspot.x || '50%',
              top: hotspot.y || '60%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(16, 185, 129, 0.85)',
              border: '2px solid #ffffff',
              color: '#ffffff',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.6), 0 4px 6px rgba(0,0,0,0.3)',
              zIndex: 2050,
              animation: 'bouncePulse 2s infinite',
              transition: 'all 0.25s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
            title={`Go to ${rooms.find(r => r.id === hotspot.targetRoomId)?.name || 'Next Room'}`}
          >
            {/* Arrow Up SVG icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        )
      })}

      {/* Embedded bouncing style rules */}
      <style>{`
        @keyframes bouncePulse {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0);
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-6px);
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.9);
          }
        }
      `}</style>
    </div>
  )
}
