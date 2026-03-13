import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Center of India
const CAR_ICON = 'https://maps.google.com/mapfiles/kml/shapes/cabs.png';
const LIBRARIES = ['places'];

export default function LiveMap({ pickup, drop, driverLocation }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  const [directions, setDirections] = useState(null);
  const [map, setMap] = useState(null);

  // Parse string locations if they came from the database (e.g. "lat,lng")
  // Or handle named locations (e.g. "Sodepur" vs "Khardaha")
  const getCoordinates = async (locationStr) => {
    // If it's already a lat/lng comma string, parse it
    if (locationStr && locationStr.includes(',')) {
      const parts = locationStr.split(',');
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
      }
    }
    // Otherwise rely on Directions API to geocode the string address natively!
    return locationStr;
  };

  useEffect(() => {
    if (!pickup || !drop || !window.google) return;

    const fetchDirections = async () => {
      const directionsService = new window.google.maps.DirectionsService();
      try {
        const results = await directionsService.route({
          origin: pickup,
          destination: drop,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });
        setDirections(results);
      } catch (err) {
        console.error("Failed to fetch directions for map", err);
      }
    };

    fetchDirections();
  }, [pickup, drop, isLoaded]);

  // When driver location arrives, smoothly pan the map
  useEffect(() => {
    if (map && driverLocation && driverLocation.lat && driverLocation.lng) {
      map.panTo(driverLocation);
    }
  }, [driverLocation, map]);

  if (!isLoaded) return <div className="spinner" style={{ height: '400px' }} />;

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Missing API Key Warning Banner */}
      {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', padding: '10px', zIndex: 10, textAlign: 'center' }}>
          ⚠️ Missing Google Maps API Key in .env
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={defaultCenter}
        onLoad={m => setMap(m)}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#2f3948" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ] // Dark mode map styles perfect for your UI!
        }}
      >
        {/* Draw the route between A and B */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: { strokeColor: '#5a9ae6', strokeOpacity: 0.8, strokeWeight: 5 },
              suppressMarkers: false // Keep default A/B markers
            }}
          />
        )}

        {/* Draw the moving driver car icon */}
        {driverLocation && driverLocation.lat && driverLocation.lng && (
          <Marker
            position={driverLocation}
            icon={{
              url: CAR_ICON, // Using simple standard car icon 
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16)
            }}
            zIndex={100}
          />
        )}
      </GoogleMap>
    </div>
  );
}
