import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import LayoutBuilder from './pages/LayoutBuilder'
import BuildingLayoutBuilder from './pages/BuildingLayoutBuilder'
import CreateBuildingPage from './pages/CreateBuildingPage'
import PublicView from './pages/PublicView'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/v/:slug" element={<PublicView />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route
        path="/create"
        element={
          <AdminRoute>
            <LayoutBuilder />
          </AdminRoute>
        }
      />
      <Route
        path="/create/building"
        element={
          <AdminRoute>
            <CreateBuildingPage />
          </AdminRoute>
        }
      />
      <Route
        path="/layout/:id/edit/building"
        element={
          <AdminRoute>
            <BuildingLayoutBuilder />
          </AdminRoute>
        }
      />
      <Route
        path="/layout/:id/edit"
        element={
          <AdminRoute>
            <LayoutBuilder />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
