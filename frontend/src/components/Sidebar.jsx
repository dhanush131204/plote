import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/projects', label: 'Projects' },
    { to: '/admin/leads', label: 'Leads' },
    { to: '/customers', label: 'Customers' },
    { to: '/insights', label: 'Insights' },
    { to: '/settings', label: 'Settings' },
  ];

  const buyerLinks = [
    { to: '/buyer/projects', label: 'Explore' },
    { to: '/buyer/saved', label: 'Saved' },
    { to: '/buyer/interests', label: 'My Activity' },
    { to: '/buyer/profile', label: 'Profile' },
  ];

  const links = isAdmin ? adminLinks : buyerLinks;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>PlotVision</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-title">{isAdmin ? 'Admin Studio' : 'Buyer Space'}</div>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="profile-avatar">{user?.email?.[0]?.toUpperCase()}</div>
          <div className="profile-info">
            <span className="profile-name">{user?.email}</span>
            <span className="profile-role">{isAdmin ? 'Admin' : 'Buyer'}</span>
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
