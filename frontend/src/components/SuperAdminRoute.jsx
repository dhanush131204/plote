import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading">Loading...</div>
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return children
}
