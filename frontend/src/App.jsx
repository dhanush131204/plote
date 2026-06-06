import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Layouts from './pages/Layouts'
import PlotMaps from './pages/PlotMaps'
import BuildingLayouts from './pages/BuildingLayouts'
import Leads from './pages/Leads'
import Users from './pages/Users'
import Settings from './pages/Settings'
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
        <Route path="/admin" element={<Leads />} />
        <Route path="/layouts" element={<Layouts />} />
        <Route path="/plot-maps" element={<PlotMaps />} />
        <Route path="/building-layouts" element={<BuildingLayouts />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create" element={<LayoutBuilder />} />
        <Route path="/create/building" element={<CreateBuildingPage />} />
        <Route path="/layout/:id/edit/building" element={<BuildingLayoutBuilder />} />
        <Route path="/layout/:id/edit" element={<LayoutBuilder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
