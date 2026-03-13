import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookRide } from '../../api/rideApi';
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer, Marker } from '@react-google-maps/api';

const LIBRARIES = ['places'];
const mapContainerStyle = { width: '100%', height: '340px', borderRadius: '12px' };
const defaultCenter = { lat: 22.5726, lng: 88.3639 }; // Kolkata

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

export default function BookRide() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickupLocation: '', dropLocation: '',
    pickupLat: null, pickupLng: null, dropLat: null, dropLng: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  const pickupAutoRef = useRef(null);
  const dropAutoRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  const onPickupLoad = useCallback((autocomplete) => {
    pickupAutoRef.current = autocomplete;
  }, []);

  const onDropLoad = useCallback((autocomplete) => {
    dropAutoRef.current = autocomplete;
  }, []);

  const onPickupChanged = () => {
    const place = pickupAutoRef.current?.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setForm(prev => ({
        ...prev,
        pickupLocation: place.formatted_address || place.name,
        pickupLat: lat, pickupLng: lng
      }));
    }
  };

  const onDropChanged = () => {
    const place = dropAutoRef.current?.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setForm(prev => ({
        ...prev,
        dropLocation: place.formatted_address || place.name,
        dropLat: lat, dropLng: lng
      }));
    }
  };

  // Calculate route when both locations are set
  const calculateRoute = useCallback(() => {
    if (!form.pickupLocation || !form.dropLocation || !window.google) return;
    const service = new window.google.maps.DirectionsService();
    service.route({
      origin: form.pickupLat ? { lat: form.pickupLat, lng: form.pickupLng } : form.pickupLocation,
      destination: form.dropLat ? { lat: form.dropLat, lng: form.dropLng } : form.dropLocation,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
        const leg = result.routes[0].legs[0];
        setDistance(leg.distance.text);
        setDuration(leg.duration.text);
      }
    });
  }, [form.pickupLocation, form.dropLocation, form.pickupLat, form.pickupLng, form.dropLat, form.dropLng]);

  // Trigger route calculation when drop location changes
  const onDropChangedFull = () => {
    onDropChanged();
    setTimeout(() => calculateRoute(), 300);
  };

  const onPickupChangedFull = () => {
    onPickupChanged();
    setTimeout(() => calculateRoute(), 300);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.pickupLocation || !form.dropLocation) {
      setError('Please select both pickup and drop locations');
      return;
    }
    setError(''); setLoading(true);
    try {
      const payload = {
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation,
        pickupLat: form.pickupLat, pickupLng: form.pickupLng,
        dropLat: form.dropLat, dropLng: form.dropLng,
      };
      await bookRide(payload);
      navigate('/rider/dashboard');
    } catch (e) { setError(e.response?.data?.error || 'Booking failed'); setLoading(false); }
  };

  return (
    <div className="page fade-in" style={{ maxWidth: '900px', margin: '32px auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left: Location Inputs (Uber-style) */}
        <div className="card">
          <h1 style={{ marginBottom: '4px', fontSize: '24px' }}>Where to?</h1>
          <p className="subtitle" style={{ marginBottom: '24px' }}>Select your pickup and drop locations</p>
          
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            {/* Pickup Input */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ 
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', 
                width: '10px', height: '10px', borderRadius: '50%', background: '#4CAF50', zIndex: 2
              }} />
              {isLoaded ? (
                <Autocomplete onLoad={onPickupLoad} onPlaceChanged={onPickupChangedFull}>
                  <input
                    placeholder="Pickup location"
                    style={{
                      width: '100%', padding: '14px 14px 14px 36px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text)', fontSize: '15px',
                      outline: 'none', transition: 'border 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </Autocomplete>
              ) : (
                <input placeholder="Loading..." disabled style={{ width: '100%', padding: '14px 14px 14px 36px' }} />
              )}
            </div>

            {/* Connecting line between dots */}
            <div style={{ position: 'relative', marginLeft: '18px', height: '0', marginBottom: '0' }}>
              <div style={{ 
                position: 'absolute', top: '-16px', left: '0', width: '2px', height: '16px',
                background: 'var(--text-muted)', opacity: 0.4
              }} />
            </div>

            {/* Drop Input */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ 
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', 
                width: '10px', height: '10px', borderRadius: '2px', background: '#f44336', zIndex: 2
              }} />
              {isLoaded ? (
                <Autocomplete onLoad={onDropLoad} onPlaceChanged={onDropChangedFull}>
                  <input
                    placeholder="Dropoff location"
                    style={{
                      width: '100%', padding: '14px 14px 14px 36px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text)', fontSize: '15px',
                      outline: 'none', transition: 'border 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </Autocomplete>
              ) : (
                <input placeholder="Loading..." disabled style={{ width: '100%', padding: '14px 14px 14px 36px' }} />
              )}
            </div>

            {/* Route Info */}
            {distance && duration && (
              <div style={{ 
                display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px', 
                background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)'
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distance</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>{distance}</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Time</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{duration}</div>
                </div>
              </div>
            )}

            <div className="alert alert-info" style={{ marginBottom: '16px' }}>Fare = Rs 30 base + Rs 12/km</div>

            <button className="btn btn-primary btn-full btn-lg" disabled={loading || !form.pickupLocation || !form.dropLocation}>
              {loading ? 'Finding driver...' : 'Confirm Ride'}
            </button>
          </form>
        </div>

        {/* Right: Live Map Preview */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={12}
              center={
                form.pickupLat ? { lat: form.pickupLat, lng: form.pickupLng } : defaultCenter
              }
              options={{ disableDefaultUI: true, zoomControl: true, styles: darkMapStyles }}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    polylineOptions: { strokeColor: '#5a9ae6', strokeOpacity: 0.9, strokeWeight: 5 },
                    suppressMarkers: false
                  }}
                />
              )}

              {/* Pickup marker (if no directions yet) */}
              {!directions && form.pickupLat && (
                <Marker position={{ lat: form.pickupLat, lng: form.pickupLng }} label="A" />
              )}

              {/* Drop marker (if no directions yet) */}
              {!directions && form.dropLat && (
                <Marker position={{ lat: form.dropLat, lng: form.dropLng }} label="B" />
              )}
            </GoogleMap>
          ) : (
            <div style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          )}

          {/* Map info overlay at bottom */}
          {directions && (
            <div style={{ 
              padding: '16px', background: 'var(--card)', 
              borderTop: '1px solid var(--border)', textAlign: 'center'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Route preview: {form.pickupLocation} → {form.dropLocation}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
