import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import builderBg from '../assets/builderbackgroundeimage.png';
import superAdminBg from '../assets/superadminbackgroundeimage.png';

export default function AppLayout() {
  const { user } = useAuth();
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

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

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-content" style={bgStyle}>
        <Outlet />
      </div>
    </div>
  );
}
