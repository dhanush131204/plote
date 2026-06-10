import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const isSuperAdmin = user?.role === 'super_admin';

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/projects', label: 'My Projects' },
    { to: '/admin/leads', label: 'Leads' },
    { to: '/profile', label: 'Company Profile' },
  ];

  const superAdminLinks = [
    { to: '/platform/dashboard', label: 'Dashboard' },
    { to: '/platform/admins', label: 'Manage Builders' },
    { to: '/platform/projects', label: 'Global Projects' },
  ];

  const buyerLinks = [
    { to: '/buyer/projects', label: 'Explore' },
    { to: '/buyer/saved', label: 'Saved' },
    { to: '/buyer/interests', label: 'My Activity' },
    { to: '/buyer/profile', label: 'Profile' },
  ];

  const links = isSuperAdmin ? superAdminLinks : (isAdmin ? adminLinks : buyerLinks);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>PlotVision</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-title">{isSuperAdmin ? 'Platform Management' : (isAdmin ? 'Builder Studio' : 'Buyer Space')}</div>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {link.label}
          </NavLink>
        ))}

        {isAdmin && !isSuperAdmin && (
          <>
            <div className="nav-group-divider" />
            <div className="nav-group-title">Quick Actions</div>
            <NavLink to="/create" className={({ isActive }) => `nav-item nav-item--action ${isActive ? 'active' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Plot Map
            </NavLink>
            <NavLink to="/create/building" className={({ isActive }) => `nav-item nav-item--action ${isActive ? 'active' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Building
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="profile-avatar">{(user?.name || user?.email)?.[0]?.toUpperCase()}</div>
          <div className="profile-info">
            <span className="profile-name">{user?.name || user?.email}</span>
            <span className="profile-role">{isSuperAdmin ? 'Super Admin' : (isAdmin ? 'Builder' : 'Buyer')}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Log Out
        </button>
      </div>
    </aside>
  );
}
