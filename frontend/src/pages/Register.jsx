import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const ROLES = ['RIDER', 'DRIVER', 'ADMIN'];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', phone: '', role: 'RIDER',
    vehicleNumber: '', vehicleType: 'SEDAN', licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data);
      if (data.role === 'DRIVER') navigate('/driver/dashboard');
      else if (data.role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/rider/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-sm" style={{ marginTop: '32px' }}>
      <div className="card fade-in">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚀</div>
          <h1 style={{ fontSize: '22px' }}>Create Account</h1>
          <p className="subtitle">Join CabApp today</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="input-group"><label>Full Name</label><input name="username" placeholder="John Doe" value={form.username} onChange={handle} required /></div>
          <div className="input-group"><label>Email</label><input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required /></div>
          <div className="input-group"><label>Password</label><input type="password" name="password" placeholder="Min 6 characters" value={form.password} onChange={handle} required /></div>
          <div className="input-group"><label>Phone</label><input name="phone" placeholder="9XXXXXXXXX" value={form.phone} onChange={handle} required /></div>
          <div className="input-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handle}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {form.role === 'DRIVER' && (
            <>
              <div className="input-group"><label>Vehicle Number</label><input name="vehicleNumber" placeholder="KA01AB1234" value={form.vehicleNumber} onChange={handle} required /></div>
              <div className="input-group">
                <label>Vehicle Type</label>
                <select name="vehicleType" value={form.vehicleType} onChange={handle}>
                  {['SEDAN','SUV','AUTO','BIKE'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="input-group"><label>License Number</label><input name="licenseNumber" placeholder="DL-XXXXXXXX" value={form.licenseNumber} onChange={handle} required /></div>
            </>
          )}
          <button className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
