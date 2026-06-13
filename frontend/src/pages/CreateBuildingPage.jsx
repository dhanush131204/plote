import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateLayoutMutation } from '../api/apiSlice'
import { defaultBuilding } from '../utils/buildingSchema'

export default function CreateBuildingPage() {
  const [createLayout] = useCreateLayoutMutation()
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const createdRef = useRef(false)

  useEffect(() => {
    if (createdRef.current) return
    createdRef.current = true

    const doCreate = async () => {
      try {
        const created = await createLayout({
          name: 'Untitled building',
          layoutKind: 'building',
          building: defaultBuilding(),
        }).unwrap()
        
        const newId = created?.id
        if (newId != null) {
          navigate(`/layout/${newId}/edit/building`, { replace: true })
        } else {
          setError('Server did not return a layout id.')
        }
      } catch (err) {
        setError(err.data?.error || err.message || 'Failed to create layout')
      }
    }
    
    doCreate()
  }, [createLayout, navigate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '80vh' }}>
      <div style={{ padding: '3rem', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px' }}>
        {error ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 1rem', color: '#ef4444' }}>Creation Failed</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{error}</p>
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginTop: '1.5rem' }}>Go Back</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏗️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Creating Workspace</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Setting up your new building layout...</p>
          </>
        )}
      </div>
    </div>
  )
}
