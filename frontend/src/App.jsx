import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import RiderDashboard from './pages/rider/RiderDashboard';
import BookRide from './pages/rider/BookRide';
import RideHistory from './pages/rider/RideHistory';
import DriverDashboard from './pages/driver/DriverDashboard';
import PendingRides from './pages/driver/PendingRides';
import DriverHistory from './pages/driver/DriverHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to={getDashboard(user.role)} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={getDashboard(user.role)} /> : <Register />} />

        {/* Rider Routes */}
        <Route path="/rider/dashboard" element={<ProtectedRoute role="RIDER"><RiderDashboard /></ProtectedRoute>} />
        <Route path="/rider/book" element={<ProtectedRoute role="RIDER"><BookRide /></ProtectedRoute>} />
        <Route path="/rider/history" element={<ProtectedRoute role="RIDER"><RideHistory /></ProtectedRoute>} />

        {/* Driver Routes */}
        <Route path="/driver/dashboard" element={<ProtectedRoute role="DRIVER"><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/rides" element={<ProtectedRoute role="DRIVER"><PendingRides /></ProtectedRoute>} />
        <Route path="/driver/history" element={<ProtectedRoute role="DRIVER"><DriverHistory /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function getDashboard(role) {
  if (role === 'DRIVER') return '/driver/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/rider/dashboard';
}

export default App;
