import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading">Loading...</div>
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/buyer/projects" replace />
  return children
}
