import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = user?.role === 'RIDER'
    ? [{ to: '/rider/dashboard', label: 'Dashboard' }, { to: '/rider/book', label: 'Book Ride' }, { to: '/rider/history', label: 'History' }]
    : user?.role === 'DRIVER'
    ? [{ to: '/driver/dashboard', label: 'Dashboard' }, { to: '/driver/rides', label: 'Rides' }, { to: '/driver/history', label: 'History' }]
    : user?.role === 'ADMIN'
    ? [{ to: '/admin/dashboard', label: 'Dashboard' }]
    : [];

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        {links.map(l => <Link key={l.to} to={l.to} className="nav-link">{l.label}</Link>)}
      </div>
      <div className="navbar-actions">
        {user ? (
          <>
            <span className="nav-user">👤 {user.username}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
