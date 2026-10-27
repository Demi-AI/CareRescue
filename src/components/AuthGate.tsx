import { Navigate, Outlet, useLocation } from 'react-router';

export default function AuthGate() {
  const location = useLocation();
  return sessionStorage.getItem('careRescueSession')
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}
