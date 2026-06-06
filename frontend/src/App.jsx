import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/AppLayout'
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
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Buyer Routes placeholders, routing to dashboard for now */}
        <Route path="/projects" element={<Dashboard />} />
        <Route path="/saved" element={<Dashboard />} />
        <Route path="/interests" element={<Dashboard />} />
        <Route path="/support" element={<Dashboard />} />
      </Route>
      <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
        <Route path="/admin" element={<Admin />} />
        <Route path="/layouts" element={<Dashboard />} />
        <Route path="/plot-maps" element={<Dashboard />} />
        <Route path="/building-layouts" element={<Dashboard />} />
        <Route path="/settings" element={<Admin />} />
        <Route path="/create" element={<LayoutBuilder />} />
        <Route path="/create/building" element={<CreateBuildingPage />} />
        <Route path="/layout/:id/edit/building" element={<BuildingLayoutBuilder />} />
        <Route path="/layout/:id/edit" element={<LayoutBuilder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
