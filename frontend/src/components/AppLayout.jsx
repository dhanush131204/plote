import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import builderBg from '../assets/builderbackgroundeimage.png';
import superAdminBg from '../assets/superadminbackgroundeimage.png';

export default function AppLayout() {
  const { user } = useAuth();
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isImpersonating = Boolean(localStorage.getItem('impersonateUserId'));

  let bgImage = null;
  if (isSuperAdmin) {
    bgImage = superAdminBg;
  } else if (isAdmin) {
    bgImage = builderBg;
  }

  const bgStyle = bgImage ? {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'right bottom',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh'
  } : {};

  const handleStopImpersonating = () => {
    localStorage.removeItem('impersonateUserId');
    window.location.href = '/platform/admins';
  };

  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {isImpersonating && (
        <div style={{
          background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
          color: '#fff',
          padding: '0.75rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
          zIndex: 100,
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          fontWeight: '600',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👁️</span>
            <span>
              Viewing Dashboard as Builder: <strong style={{ color: '#fef08a' }}>{user?.name || user?.email}</strong>
              {user?.companyName && ` (${user.companyName})`}
            </span>
          </div>
          <button
            onClick={handleStopImpersonating}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            Exit Impersonation
          </button>
        </div>
      )}
      <div className="app-layout-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div className="app-main-content" style={bgStyle}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
