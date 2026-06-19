import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import SuperAdminRoute from './components/SuperAdminRoute'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import Dashboard from './pages/Dashboard'
import Layouts from './pages/Layouts'
import PlotMaps from './pages/PlotMaps'
import BuildingLayouts from './pages/BuildingLayouts'
import Leads from './pages/Leads'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Insights from './pages/Insights'
import ProfilePage from './pages/ProfilePage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import ManageAdmins from './pages/ManageAdmins'
import GlobalProjects from './pages/GlobalProjects'
import LayoutBuilder from './pages/LayoutBuilder'
import BuildingLayoutBuilder from './pages/BuildingLayoutBuilder'
import PublicView from './pages/PublicView'
import ProjectsPage from './pages/ProjectsPage'
import SavedPlotsPage from './pages/SavedPlotsPage'
import MyInterestsPage from './pages/MyInterestsPage'
import ContactSupportPage from './pages/ContactSupportPage'
import TrackLeadPage from './pages/TrackLeadPage'
import SubscriptionPage from './pages/SubscriptionPage'
import SuperAdminSubscriptions from './pages/SuperAdminSubscriptions'
import SuperAdminPayments from './pages/SuperAdminPayments'
import SuperAdminRevenue from './pages/SuperAdminRevenue'
import SuperAdminSettings from './pages/SuperAdminSettings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Navigate to="/?register=true" replace />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/v/:slug" element={<PublicView />} />
      <Route path="/track/:trackingId" element={<TrackLeadPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/buyer/dashboard" element={<Dashboard />} />
        <Route path="/buyer/projects" element={<ProjectsPage />} />
        <Route path="/buyer/saved" element={<SavedPlotsPage />} />
        <Route path="/buyer/interests" element={<MyInterestsPage />} />
        <Route path="/buyer/profile" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/buyer/support" element={<ContactSupportPage />} />
      </Route>
      <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
        <Route path="/admin" element={<Navigate to="/admin/leads" replace />} />
        <Route path="/admin/leads" element={<Leads />} />
        <Route path="/projects" element={<Layouts />} />
        <Route path="/customers" element={<Users />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/layouts" element={<Layouts />} />
        <Route path="/plot-maps" element={<PlotMaps />} />
        <Route path="/building-layouts" element={<BuildingLayouts />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/create" element={<LayoutBuilder />} />
        <Route path="/create/building" element={<BuildingLayoutBuilder />} />
        <Route path="/layout/:id/edit/building" element={<BuildingLayoutBuilder />} />
        <Route path="/layout/:id/edit" element={<LayoutBuilder />} />
      </Route>
      <Route element={<SuperAdminRoute><AppLayout /></SuperAdminRoute>}>
        <Route path="/platform/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/platform/admins" element={<ManageAdmins />} />
        <Route path="/platform/projects" element={<GlobalProjects />} />
        <Route path="/platform/subscriptions" element={<SuperAdminSubscriptions />} />
        <Route path="/platform/payments" element={<SuperAdminPayments />} />
        <Route path="/platform/revenue" element={<SuperAdminRevenue />} />
        <Route path="/platform/settings" element={<SuperAdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/buyer/dashboard" replace />} /> {/* Redirect to buyer dashboard if not found */}
    </Routes>
  )
}
