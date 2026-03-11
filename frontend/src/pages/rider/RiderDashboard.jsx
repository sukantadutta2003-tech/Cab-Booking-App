import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getRideHistory, cancelRide } from '../../api/rideApi';
import { getPayment, confirmPayment } from '../../api/paymentApi';
import { submitRating, getRatingForRide } from '../../api/ratingApi';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const statusColor = (s) => `badge badge-${s?.toLowerCase().replace('_', '_')}`;

export default function RiderDashboard() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRide, setActiveRide] = useState(null);
  const [payment, setPayment] = useState(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const [rating, setRating] = useState({ stars: 5, comment: '' });
  const [ratingDone, setRatingDone] = useState(false);
  const [msg, setMsg] = useState('');
  const stompRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await getRideHistory();
      setRides(data);
      
      let currentActive = null;
      let pData = null;
      let rDone = false;
      
      for (const r of data) {
        if (['REQUESTED','ACCEPTED','IN_PROGRESS'].includes(r.status)) {
          currentActive = r;
          try { const p = await getPayment(r.id); pData = p.data; } catch {}
          break; // found ongoing
        } else if (r.status === 'COMPLETED' && !currentActive) {
          try { const p = await getPayment(r.id); pData = p.data; } catch {}
          try { await getRatingForRide(r.id); rDone = true; } catch {}
          
          // Keep it as active ride ONLY if payment is pending or rating is missing
          if (!pData || pData.status !== 'COMPLETED' || !rDone) {
             currentActive = r;
             break;
          }
        }
      }
      
      setActiveRide(currentActive);
      setPayment(pData);
      setRatingDone(rDone);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // WebSocket: subscribe to active ride updates
  useEffect(() => {
    if (!activeRide) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        client.subscribe(`/topic/ride/${activeRide.id}`, (msg) => {
          const data = JSON.parse(msg.body);
          setActiveRide(data);
          if (data.status === 'COMPLETED') load();
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => client.deactivate();
  }, [activeRide?.id]);

  const handleConfirmPayment = async () => {
    try {
      const { data } = await confirmPayment(activeRide.id, payMethod);
      setPayment(data);
      setMsg('✅ Payment confirmed!');
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || 'Payment failed')); }
  };

  const handleCancel = async () => {
    try {
      if (!confirm('Are you sure you want to cancel this ride?')) return;
      await cancelRide(activeRide.id);
      setMsg('✅ Ride cancelled successfully.');
      load();
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || 'Failed to cancel')); }
  };

  const handleRating = async () => {
    try {
      await submitRating({ rideId: activeRide.id, stars: rating.stars, comment: rating.comment });
      setRatingDone(true);
      setMsg('⭐ Rating submitted!');
      load();
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || 'Rating failed')); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div><h1>Rider Dashboard</h1><p className="subtitle">Your rides & activity</p></div>
        <Link to="/rider/book" className="btn btn-primary">🚖 Book New Ride</Link>
      </div>

      {msg && <div className="alert alert-info" onClick={() => setMsg('')}>{msg}</div>}

      {activeRide && (
        <div className="card" style={{ marginBottom: '28px', border: '1px solid var(--border-glow)' }}>
          <h2 style={{ marginBottom: '16px' }}>🔴 Active Ride</h2>
          <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
            <Info label="Pickup" value={activeRide.pickupLocation} />
            <Info label="Drop" value={activeRide.dropLocation} />
            <Info label="Status" value={<span className={statusColor(activeRide.status)}>{activeRide.status}</span>} />
            <Info label="Fare" value={`₹${activeRide.fare}`} />
            {activeRide.driverName ? (
              <Info label="Driver" value={`${activeRide.driverName} • ${activeRide.vehicleNumber}`} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                  Looking for drivers...
                </div>
              </div>
            )}
          </div>
          
          {(activeRide.status === 'REQUESTED' || activeRide.status === 'ACCEPTED') && (
            <div style={{ marginTop: '16px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
                Cancel Ride
              </button>
            </div>
          )}

          {activeRide.status === 'COMPLETED' && (
            <>
              {(!payment || payment.status === 'PENDING') && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                  <h3 style={{ marginBottom: '12px' }}>💳 Confirm Payment — ₹{activeRide.fare}</h3>
                  <div className="input-group">
                    <label>Payment Method</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                      {['CASH','CARD','UPI'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-success" onClick={handleConfirmPayment}>Confirm Payment</button>
                </div>
              )}
              {payment?.status === 'COMPLETED' && !ratingDone && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                  <h3 style={{ marginBottom: '12px' }}>⭐ Rate Your Driver</h3>
                  <div className="stars" style={{ marginBottom: '12px' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`star ${s <= rating.stars ? 'filled' : ''}`} onClick={() => setRating({...rating, stars: s})}>★</span>
                    ))}
                  </div>
                  <div className="input-group">
                    <label>Comment (optional)</label>
                    <input placeholder="Great ride!" value={rating.comment} onChange={e => setRating({...rating, comment: e.target.value})} />
                  </div>
                  <button className="btn btn-warning" onClick={handleRating}>Submit Rating</button>
                </div>
              )}
              {ratingDone && <div className="alert alert-success">Thanks for rating! 🌟</div>}
            </>
          )}
        </div>
      )}

      <h2 style={{ marginBottom: '16px' }}>📋 Ride History</h2>
      {rides.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No rides yet!</p>
          <Link to="/rider/book" className="btn btn-primary">Book Your First Ride</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>From → To</th><th>Status</th><th>Fare</th><th>Driver</th><th>Date</th></tr></thead>
            <tbody>
              {rides.map(r => (
                <tr key={r.id}>
                  <td>{r.pickupLocation} → {r.dropLocation}</td>
                  <td><span className={statusColor(r.status)}>{r.status}</span></td>
                  <td>₹{r.fare}</td>
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

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontWeight: '600' }}>{value}</div>
    </div>
  );
}
