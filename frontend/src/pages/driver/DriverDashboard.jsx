import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { updateStatus, getEarnings, getDriverHistory, startRide, completeRide } from '../../api/driverApi';

const STATUS_OPTIONS = ['AVAILABLE', 'OFFLINE'];
const sc = (s) => `badge badge-${s?.toLowerCase()}`;

export default function DriverDashboard() {
  const [earnings, setEarnings] = useState(null);
  const [rides, setRides] = useState([]);
  const [status, setStatus] = useState('OFFLINE');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([getEarnings(), getDriverHistory()])
      .then(([e, r]) => { 
        setEarnings(e.data); 
        if (e.data.status) setStatus(e.data.status);
        setRides(r.data); 
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus({ status: newStatus, currentLat: 12.9716, currentLng: 77.5946 });
      setStatus(newStatus);
      setMsg(`✅ Status updated to ${newStatus}`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || 'Failed')); }
  };

  const handleRideAction = async (rideId, action) => {
    try {
      if (action === 'start') {
        await startRide(rideId);
        setMsg('✅ Ride Started!');
      } else if (action === 'complete') {
        await completeRide(rideId);
        setStatus('AVAILABLE');
        setMsg('✅ Ride Completed! Pending Payment.');
      }
      
      // Refresh history
      const r = await getDriverHistory();
      setRides(r.data);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.error || 'Action failed'));
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div><h1>Driver Dashboard</h1><p className="subtitle">Manage your rides & earnings</p></div>
        <Link to="/driver/rides" className="btn btn-primary">🚗 Pending Rides</Link>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Status Toggle */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>🔘 Availability Status</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              className={`btn ${status === s ? (s === 'AVAILABLE' ? 'btn-success' : 'btn-secondary') : 'btn-secondary'}`}
              onClick={() => handleStatusChange(s)}
            >
              {s === 'AVAILABLE' ? '🟢' : '⚫'} {s}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
          Current: <span className={sc(status)}>{status}</span>
        </p>
      </div>

      {/* Earnings Stats */}
      {earnings && (
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          {[
            { icon: '💰', label: 'Total Earnings', value: `₹${earnings.totalEarnings?.toFixed(2)}` },
            { icon: '🚕', label: 'Total Rides', value: earnings.totalRides },
            { icon: '⭐', label: 'Rating', value: earnings.rating?.toFixed(1) || '—' },
            { icon: '✅', label: 'Completed', value: earnings.completedRideCount },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ride History */}
      <h2 style={{ marginBottom: '16px' }}>📋 Ride History</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Pickup → Drop</th><th>Status</th><th>Fare</th><th>Rider</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {rides.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No rides yet</td></tr>
            ) : rides.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.pickupLocation} → {r.dropLocation}</td>
                <td><span className={sc(r.status)}>{r.status}</span></td>
                <td>₹{r.fare}</td>
                <td>{r.riderName || '—'}</td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  {r.status === 'ACCEPTED' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleRideAction(r.id, 'start')}>
                      🚀 Start
                    </button>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleRideAction(r.id, 'complete')}>
                      🏁 Complete
                    </button>
                  )}
                  {r.status !== 'ACCEPTED' && r.status !== 'IN_PROGRESS' && (
                    <span style={{color: 'var(--text-muted)'}}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
