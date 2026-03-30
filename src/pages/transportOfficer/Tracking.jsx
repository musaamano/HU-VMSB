import { useState, useEffect } from "react";
import "./tracking.css";

export default function Tracking() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const data = [
      {
        id: "BUS-12",
        driver: "John Doe",
        route: "Main Campus → Campus B",
        lat: 9.03,
        lng: 38.74,
        status: "moving",
      },
      {
        id: "VAN-04",
        driver: "Michael",
        route: "Store → Warehouse",
        lat: 9.05,
        lng: 38.70,
        status: "idle",
      },
      {
        id: "BUS-09",
        driver: "Alex",
        route: "Garage → Campus A",
        lat: 9.01,
        lng: 38.72,
        status: "offline",
      },
    ];
    setVehicles(data);

    // Try to load map libraries
    const checkMapLibraries = async () => {
      try {
        await import('leaflet');
        await import('react-leaflet');
        setMapLoaded(true);
      } catch (error) {
        console.log('Map libraries not installed. Run: npm install leaflet react-leaflet');
        setMapLoaded(false);
      }
    };
    
    checkMapLibraries();
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.driver.toLowerCase().includes(search.toLowerCase()) ||
      v.route.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tracking-page">
      <header className="tracking-header">
        <h1>Vehicle Tracking</h1>
        <p>Monitor vehicles in real time</p>

        <div className="tracking-search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by Vehicle ID, Driver, or Route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tracking-search"
          />
        </div>
      </header>

      <div className="tracking-container">
        <div className="tracking-cards">
          {filteredVehicles.map((v) => (
            <div className="tracking-card" key={v.id}>
              <div>
                <strong>Vehicle: {v.id}</strong>
                <span>Driver: {v.driver}</span>
                <span>Route: {v.route}</span>
                <span>Location: {v.lat}°N, {v.lng}°E</span>
              </div>
              <span className={`track-status ${v.status}`}>
                ● {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
              </span>
            </div>
          ))}

          {filteredVehicles.length === 0 && (
            <p className="no-results">No vehicles found.</p>
          )}
        </div>

        <div className="tracking-map-container">
          {mapLoaded ? (
            <div className="map-loading">
              <p>Loading map...</p>
            </div>
          ) : (
            <div className="map-placeholder">
              <div className="map-placeholder-content">
                <svg className="map-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                <h3>Interactive Map</h3>
                <p>Real-time vehicle tracking map</p>
                <div className="map-info">
                  <div className="info-item">
                    <span className="info-label">Total Vehicles:</span>
                    <span className="info-value">{vehicles.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Active:</span>
                    <span className="info-value">{vehicles.filter(v => v.status === 'moving').length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Idle:</span>
                    <span className="info-value">{vehicles.filter(v => v.status === 'idle').length}</span>
                  </div>
                </div>
                <div className="map-note">
                  <p>📍 To enable the interactive map, run:</p>
                  <code>npm install leaflet react-leaflet</code>
                  <p>Then restart your development server</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}