import { useState, useEffect } from 'react';
import { getStats, getAllDrivers, getAllUsers, getAllRides } from '../../api/adminApi';

const sc = (s) => `badge badge-${s?.toLowerCase()}`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getAllDrivers(), getAllUsers(), getAllRides()])
      .then(([s, d, u, r]) => {
        setStats(s.data);
        setDrivers(d.data);
        setUsers(u.data);
        setRides(r.data.content || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const TABS = ['stats', 'rides', 'drivers', 'users'];

  return (
    <div className="page fade-in">
      <h1 style={{ marginBottom: '4px' }}>📊 Admin Dashboard</h1>
      <p className="subtitle" style={{ marginBottom: '24px' }}>Platform-wide visibility</p>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab(t)}
          >
            {t === 'stats' ? '📈 Stats' : t === 'rides' ? '🚕 Rides' : t === 'drivers' ? '🚗 Drivers' : '👥 Users'}
          </button>
        ))}
      </div>

      {/* STATS TAB */}
      {tab === 'stats' && stats && (
        <>
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            {[
              { icon: '👥', label: 'Total Users', value: stats.totalUsers },
              { icon: '🚗', label: 'Total Drivers', value: stats.totalDrivers },
              { icon: '🚕', label: 'Total Rides', value: stats.totalRides },
              { icon: '💰', label: 'Total Revenue', value: `₹${stats.totalRevenue}` },
            ].map(s => (
              <div key={s.label} className="card stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Ride Breakdown</h3>
            <div className="grid-4">
              {Object.entries(stats.rideBreakdown || {}).map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>{v}</div>
                  <span className={sc(k)}>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* RIDES TAB */}
      {tab === 'rides' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Pickup → Drop</th><th>Status</th><th>Fare</th><th>Rider</th><th>Driver</th><th>Date</th></tr></thead>
            <tbody>
              {rides.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No rides</td></tr>
              ) : rides.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.pickupLocation} → {r.dropLocation}</td>
                  <td><span className={sc(r.status)}>{r.status}</span></td>
                  <td>₹{r.fare}</td>
                  <td>{r.riderName || '—'}</td>
                  <td>{r.driverName || '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DRIVERS TAB */}
      {tab === 'drivers' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Vehicle</th><th>Status</th><th>Rating</th><th>Rides</th><th>Earnings</th></tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.email}</td>
                  <td>{d.vehicleNumber} • {d.vehicleType}</td>
                  <td><span className={sc(d.status)}>{d.status}</span></td>
                  <td>⭐ {d.rating?.toFixed(1)}</td>
                  <td>{d.totalRides}</td>
                  <td>₹{d.totalEarnings?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className={`badge badge-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
