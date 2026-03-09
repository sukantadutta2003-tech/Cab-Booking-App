import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookRide } from '../../api/rideApi';

export default function BookRide() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickupLocation: '', dropLocation: '',
    pickupLat: '', pickupLng: '', dropLat: '', dropLng: '',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = {
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation,
        pickupLat: form.pickupLat ? parseFloat(form.pickupLat) : null,
        pickupLng: form.pickupLng ? parseFloat(form.pickupLng) : null,
        dropLat: form.dropLat ? parseFloat(form.dropLat) : null,
        dropLng: form.dropLng ? parseFloat(form.dropLng) : null,
      };
      const { data } = await bookRide(payload);
      setResult(data);
    } catch (e) { setError(e.response?.data?.error || 'Booking failed'); }
    finally { setLoading(false); }
  };

  if (result) return (
    <div className="page-sm fade-in" style={{ marginTop: '32px' }}>
      <div className="card" style={{ border: '1px solid rgba(16,185,129,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px' }}>🎉</div>
          <h2>Ride Booked!</h2>
          <p className="subtitle">Your ride has been successfully created</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Row label="Status" value={<span className={`badge badge-${result.status.toLowerCase()}`}>{result.status}</span>} />
          <Row label="Pickup" value={result.pickupLocation} />
          <Row label="Drop" value={result.dropLocation} />
          <Row label="Distance" value={`${result.distanceKm?.toFixed(2)} km`} />
          <Row label="Fare" value={<span style={{ color: 'var(--success)', fontWeight: '700', fontSize: '18px' }}>₹{result.fare}</span>} />
          {result.driverName && <Row label="Driver" value={`${result.driverName} • ${result.vehicleNumber} (${result.vehicleType})`} />}
          {!result.driverName && <div className="alert alert-info">⏳ Waiting for a driver to accept your ride...</div>}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setResult(null)}>Book Another</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/rider/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-sm fade-in" style={{ marginTop: '32px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '4px' }}>🚖 Book a Ride</h1>
        <p className="subtitle" style={{ marginBottom: '24px' }}>Fill in the details to get matched with a driver</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="input-group"><label>Pickup Location</label><input name="pickupLocation" placeholder="e.g. MG Road, Bangalore" value={form.pickupLocation} onChange={handle} required /></div>
          <div className="input-group"><label>Drop Location</label><input name="dropLocation" placeholder="e.g. Koramangala, Bangalore" value={form.dropLocation} onChange={handle} required /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>📍 GPS Coordinates (optional — improves driver matching & fare accuracy)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group"><label>Pickup Lat</label><input name="pickupLat" type="number" step="any" placeholder="12.9716" value={form.pickupLat} onChange={handle} /></div>
            <div className="input-group"><label>Pickup Lng</label><input name="pickupLng" type="number" step="any" placeholder="77.5946" value={form.pickupLng} onChange={handle} /></div>
            <div className="input-group"><label>Drop Lat</label><input name="dropLat" type="number" step="any" placeholder="12.9352" value={form.dropLat} onChange={handle} /></div>
            <div className="input-group"><label>Drop Lng</label><input name="dropLng" type="number" step="any" placeholder="77.6245" value={form.dropLng} onChange={handle} /></div>
          </div>
          <div className="alert alert-info" style={{ marginTop: '4px' }}>💡 Fare = ₹30 base + ₹12/km</div>
          <button className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? 'Finding driver...' : 'Book Ride 🚕'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{label}</span>
      <span style={{ fontWeight: '500' }}>{value}</span>
    </div>
  );
}
