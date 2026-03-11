import { useState, useEffect, useRef } from 'react';
import { getPendingRides, acceptRide, startRide, completeRide } from '../../api/driverApi';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function PendingRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const stompRef = useRef(null);

  const load = () => {
    setLoading(true);
    getPendingRides().then(r => setRides(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { 
    load(); 
    
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/rides/new', (message) => {
          const update = JSON.parse(message.body);
          if (update.status === 'REQUESTED') {
            setRides(prev => {
              if (prev.find(r => r.id === update.id)) return prev;
              return [update, ...prev];
            });
          } else {
            // Remove the ride if it was accepted or cancelled by someone else
            setRides(prev => prev.filter(r => r.id !== update.id));
          }
        });
      },
    });
    client.activate();
    stompRef.current = client;
    
    return () => client.deactivate();
  }, []);

  const action = async (fn, id, label) => {
    setActionLoading(id + label);
    try {
      await fn(id);
      setMsg(`✅ Ride #${id} ${label}`);
      load();
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || 'Action failed')); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div><h1>🚗 Pending Rides</h1><p className="subtitle">Rides waiting for a driver</p></div>
        <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
      </div>

      {msg && <div className="alert alert-info" onClick={() => setMsg('')}>{msg}</div>}

      {rides.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <p style={{ color: 'var(--text-secondary)' }}>No pending rides right now!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Make sure your status is AVAILABLE</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rides.map(r => (
            <div key={r.id} className="card" style={{ border: '1px solid var(--border-glow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3>Ride #{r.id}</h3>
                  <span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success)' }}>₹{r.fare}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.distanceKm?.toFixed(2)} km</div>
                </div>
              </div>
              <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>PICKUP</p><p>{r.pickupLocation}</p></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>DROP</p><p>{r.dropLocation}</p></div>
                {r.riderName && <div><p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>RIDER</p><p>{r.riderName}</p></div>}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {r.status === 'REQUESTED' && (
                  <button className="btn btn-success" disabled={!!actionLoading} onClick={() => action(acceptRide, r.id, 'accepted')}>
                    {actionLoading === r.id + 'accepted' ? '...' : '✅ Accept'}
                  </button>
                )}
                {r.status === 'ACCEPTED' && (
                  <button className="btn btn-primary" disabled={!!actionLoading} onClick={() => action(startRide, r.id, 'started')}>
                    {actionLoading === r.id + 'started' ? '...' : '▶️ Start Ride'}
                  </button>
                )}
                {r.status === 'IN_PROGRESS' && (
                  <button className="btn btn-warning" disabled={!!actionLoading} onClick={() => action(completeRide, r.id, 'completed')}>
                    {actionLoading === r.id + 'completed' ? '...' : '🏁 Complete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
