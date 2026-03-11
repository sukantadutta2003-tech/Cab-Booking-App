import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { getDriverHistory } from '../../api/driverApi';

const sc = (s) => `badge badge-${s?.toLowerCase()}`;

export default function DriverHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDriverHistory()
      .then(res => setRides(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const historyRides = rides.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status));

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1>📋 Ride History</h1>
          <p className="subtitle">All your past rides</p>
        </div>
        <Link to="/driver" className="btn btn-secondary">← Back to Dashboard</Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {historyRides.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>You have no completed rides yet.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Pickup → Drop</th><th>Status</th><th>Fare</th><th>Rider</th><th>Date</th></tr></thead>
            <tbody>
              {historyRides.map(r => (
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
      )}
    </div>
  );
}
