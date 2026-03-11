import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookRide } from '../../api/rideApi';

export default function BookRide() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickupLocation: '', dropLocation: '',
    pickupLat: '', pickupLng: '', dropLat: '', dropLng: '',
  });
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
      navigate('/rider/dashboard');
    } catch (e) { setError(e.response?.data?.error || 'Booking failed'); setLoading(false); }
  };

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
