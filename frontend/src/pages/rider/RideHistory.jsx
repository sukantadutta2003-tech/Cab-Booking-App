import { useState, useEffect } from 'react';
import { getRideHistory } from '../../api/rideApi';

const sc = (s) => `badge badge-${s?.toLowerCase()}`;

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRideHistory().then(r => setRides(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="page fade-in">
      <h1 style={{ marginBottom: '4px' }}>Ride History</h1>
      <p className="subtitle" style={{ marginBottom: '24px' }}>All your past rides</p>
      {rides.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No rides yet!</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Pickup</th><th>Drop</th><th>Status</th>
                <th>Fare</th><th>Distance</th><th>Driver</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rides.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.pickupLocation}</td>
                  <td>{r.dropLocation}</td>
                  <td><span className={sc(r.status)}>{r.status}</span></td>
                  <td>₹{r.fare}</td>
                  <td>{r.distanceKm?.toFixed(2)} km</td>
                  <td>{r.driverName || '—'}</td>
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
