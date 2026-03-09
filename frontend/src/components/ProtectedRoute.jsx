import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    if (user.role === 'DRIVER') return <Navigate to="/driver/dashboard" />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/rider/dashboard" />;
  }
  return children;
}
