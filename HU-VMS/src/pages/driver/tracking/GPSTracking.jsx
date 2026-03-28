import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import driverService from '../../../services/driverService';
import 'leaflet/dist/leaflet.css';
import './GPSTracking.css';

const GPSTracking = ({ trip }) => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [route, setRoute] = useState([]);
    const [eta, setEta] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date().toISOString()
                    };

                    setCurrentLocation(location);
                    setRoute(prev => [...prev, [location.lat, location.lng]]);

                    // Send location to server
                    driverService.updateLocation(location).catch(console.error);
                },
                (error) => console.error('GPS error:', error),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    if (!currentLocation) {
        return <div className="gps-loading">Acquiring GPS signal...</div>;
    }

    const center = [currentLocation.lat, currentLocation.lng];

    return (
        <div className="gps-tracking">
            <h2>GPS Tracking</h2>

            <div className="tracking-info">
                <div className="info-card">
                    <span>Current Location</span>
                    <strong>{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</strong>
                </div>
                <div className="info-card">
                    <span>Destination</span>
                    <strong>{trip.destination}</strong>
                </div>
                {eta && (
                    <div className="info-card">
                        <span>ETA</span>
                        <strong>{eta}</strong>
                    </div>
                )}
            </div>

            <div className="map-container">
                <MapContainer center={center} zoom={15} style={{ height: '400px', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={center}>
                        <Popup>Current Location</Popup>
                    </Marker>
                    {route.length > 1 && (
                        <Polyline positions={route} color="blue" />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default GPSTracking;
