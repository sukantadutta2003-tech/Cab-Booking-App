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

  const activeRide = rides.find(r => ['ACCEPTED', 'IN_PROGRESS'].includes(r.status));
  const historyRides = rides.filter(r => !['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status));

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

      {activeRide && (
        <div className="card fade-in" style={{ marginBottom: '28px', border: '1px solid var(--border-glow)' }}>
          <h2 style={{ marginBottom: '16px' }}>🔴 Active Ride</h2>
          <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
            <Info label="Pickup" value={activeRide.pickupLocation} />
            <Info label="Drop" value={activeRide.dropLocation} />
            <Info label="Status" value={<span className={sc(activeRide.status)}>{activeRide.status}</span>} />
            <Info label="Fare" value={`₹${activeRide.fare}`} />
            {activeRide.riderName && (
              <Info label="Rider" value={`${activeRide.riderName}`} />
            )}
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            {activeRide.status === 'ACCEPTED' && (
              <button className="btn btn-primary" onClick={() => handleRideAction(activeRide.id, 'start')}>
                🚀 Start Ride
              </button>
            )}
            {activeRide.status === 'IN_PROGRESS' && (
              <button className="btn btn-success" onClick={() => handleRideAction(activeRide.id, 'complete')}>
                🏁 Complete Ride
              </button>
            )}
          </div>
        </div>
      )}

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

      <h2 style={{ marginBottom: '16px' }}>📋 Ride History</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Pickup → Drop</th><th>Status</th><th>Fare</th><th>Rider</th><th>Date</th></tr></thead>
          <tbody>
            {historyRides.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No rides yet</td></tr>
            ) : historyRides.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.pickupLocation} → {r.dropLocation}</td>
                <td><span className={sc(r.status)}>{r.status}</span></td>
                <td>₹{r.fare}</td>
                <td>{r.riderName || '—'}</td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontWeight: '600' }}>{value}</div>
    </div>
  );
}
