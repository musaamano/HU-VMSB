import { useState, useEffect, useRef } from 'react';
import {
  Map as MapIcon, List, Car, User, Navigation, Activity,
  AlertTriangle, MapPin, Clock, CheckCircle2, RefreshCw
} from 'lucide-react';
import { getVehicles } from '../../api/api';
import './VehicleTracking.css';

const STATUS_COLOR = {
  available:      'var(--status-available)',
  'in-use':       'var(--primary-color)',
  maintenance:    'var(--status-pending)',
  'out-of-service': 'var(--status-complaint)',
};

const STATUS_LABEL = {
  available:      'Available',
  'in-use':       'In Trip',
  maintenance:    'Maintenance',
  'out-of-service': 'Out of Service',
};

export default function VehicleTracking() {
  const mapRef           = useRef(null);
  const mapInstanceRef   = useRef(null);
  const markersRef       = useRef({});
  const [vehicles, setVehicles]           = useState([]);
  const [liveCoords, setLiveCoords]       = useState({}); // _id → {lat,lng,speed}
  const [loading, setLoading]             = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapLoaded, setMapLoaded]         = useState(false);
  const [mapError, setMapError]           = useState(false);
  const [activeView, setActiveView]       = useState('fleet');
  const [statusFilter, setStatusFilter]   = useState('All');

  // ── Fetch vehicles from DB ──────────────────────────────
  const fetchVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
      // Seed liveCoords from DB location
      const coords = {};
      data.forEach(v => {
        coords[v._id] = {
          lat:   v.location?.lat  ?? 9.4140,
          lng:   v.location?.lng  ?? 42.0360,
          speed: v.speed ?? 0,
        };
      });
      setLiveCoords(coords);
    } catch (err) {
      console.error('Failed to load vehicles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  // ── Simulate movement for in-use vehicles ──────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCoords(prev => {
        const next = { ...prev };
        vehicles.forEach(v => {
          if (v.status === 'in-use') {
            const c = prev[v._id] || { lat: 9.414, lng: 42.036, speed: 50 };
            next[v._id] = {
              lat:   c.lat + (Math.random() - 0.5) * 0.002,
              lng:   c.lng + (Math.random() - 0.5) * 0.002,
              speed: Math.round(Math.max(20, Math.min(90, c.speed + (Math.random() - 0.5) * 10))),
            };
          }
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [vehicles]);

  // ── Load Leaflet ────────────────────────────────────────
  useEffect(() => {
    if (window.L) { setMapLoaded(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    css.crossOrigin = '';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.async = true;
    script.onload  = () => { setMapLoaded(true); setMapError(false); };
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);
  }, []);

  // ── Init map ────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== 'map' || !mapLoaded || !window.L || !mapRef.current || mapInstanceRef.current) return;
    try {
      mapInstanceRef.current = window.L.map(mapRef.current).setView([9.4140, 42.0360], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // University boundary
      window.L.polygon([
        [9.4050, 42.0270], [9.4050, 42.0450],
        [9.4230, 42.0450], [9.4230, 42.0270],
      ], { color: '#84cc16', fillColor: '#84cc16', fillOpacity: 0.08, weight: 2, dashArray: '5,5' })
        .addTo(mapInstanceRef.current);

      const uniIcon = window.L.divIcon({
        html: '<div style="background:#1f2937;color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.2)">🎓</div>',
        iconSize: [32, 32], className: '',
      });
      window.L.marker([9.4140, 42.0360], { icon: uniIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>Haramaya University</b><br>Main Campus');
    } catch (e) { setMapError(true); }
  }, [activeView, mapLoaded]);

  useEffect(() => {
    if (activeView === 'map' && mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 100);
    }
  }, [activeView]);

  // ── Update markers when liveCoords change ──────────────
  useEffect(() => {
    if (activeView !== 'map' || !mapInstanceRef.current || !window.L || mapError) return;
    // Remove old markers
    Object.values(markersRef.current).forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = {};

    vehicles.forEach(v => {
      const c = liveCoords[v._id];
      if (!c) return;
      const color = STATUS_COLOR[v.status] || '#6b7280';
      const icon = window.L.divIcon({
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:13px;">🚌</div>`,
        iconSize: [28, 28], className: '',
      });
      const marker = window.L.marker([c.lat, c.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width:200px;font-family:sans-serif;padding:8px">
            <b style="font-size:14px">${v.plateNumber} – ${v.model}</b><br>
            <span style="color:#6b7280;font-size:12px">${STATUS_LABEL[v.status]}</span>
            <hr style="margin:8px 0;border-color:#e5e7eb">
            <div style="font-size:13px">👤 ${v.assignedDriverName || '—'}</div>
            <div style="font-size:13px">⚡ ${c.speed} km/h</div>
            <div style="font-size:13px">📍 ${v.location?.name || '—'}</div>
            ${v.destination ? `<div style="font-size:13px">🏁 ${v.destination}</div>` : ''}
          </div>
        `);
      markersRef.current[v._id] = marker;
      if (selectedVehicle?._id === v._id) marker.openPopup();
    });
  }, [liveCoords, activeView, mapLoaded, mapError, vehicles, selectedVehicle]);

  // ── Derived ─────────────────────────────────────────────
  const filtered = vehicles.filter(v =>
    (statusFilter === 'All' || v.status === statusFilter)
  );

  const stats = {
    total:     vehicles.length,
    active:    vehicles.filter(v => v.status === 'in-use').length,
    available: vehicles.filter(v => v.status === 'available').length,
    issues:    vehicles.filter(v => ['maintenance','out-of-service'].includes(v.status)).length,
  };

  const handleVehicleClick = (v) => {
    setSelectedVehicle(v);
    setActiveView('map');
    if (mapInstanceRef.current && !mapError) {
      const c = liveCoords[v._id];
      if (c) setTimeout(() => {
        mapInstanceRef.current.setView([c.lat, c.lng], 15);
        markersRef.current[v._id]?.openPopup();
      }, 200);
    }
  };

  if (loading) return <div className="vehicle-tracking-page"><p style={{padding:'2rem',color:'#94a3b8'}}>Loading fleet...</p></div>;

  return (
    <div className="vehicle-tracking-page">
      <div className="dashboard-header">
        <div>
          <h1>Vehicle Tracking</h1>
          <p>Real-time fleet monitoring and map overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={fetchVehicles} title="Refresh" style={{
            background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)',
            color:'#818cf8', borderRadius:8, padding:'0.5rem', cursor:'pointer', display:'flex', alignItems:'center',
          }}>
            <RefreshCw size={16} />
          </button>
          <div className="view-toggle">
            <button className={`toggle-btn ${activeView === 'fleet' ? 'active' : ''}`} onClick={() => setActiveView('fleet')}>
              <List size={16} /> List View
            </button>
            <button className={`toggle-btn ${activeView === 'map' ? 'active' : ''}`} onClick={() => setActiveView('map')}>
              <MapIcon size={16} /> Map View
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="summary-cards">
        {[
          { icon: <Car size={28} />, value: stats.total,     label: 'Total Fleet',    color: 'var(--primary-color)' },
          { icon: <CheckCircle2 size={28} />, value: stats.active,    label: 'Active Trips',   color: 'var(--status-available)' },
          { icon: <Activity size={28} />, value: stats.available, label: 'Available',      color: 'var(--status-pending)' },
          { icon: <AlertTriangle size={28} />, value: stats.issues,    label: 'Need Attention', color: 'var(--status-complaint)' },
        ].map((s, i) => (
          <div key={i} className="summary-card">
            <div className="card-header">
              <div className="card-icon-wrapper" style={{ color: s.color }}>{s.icon}</div>
            </div>
            <div className="card-content">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="tracking-workspace">
        {/* ── Fleet List ── */}
        {activeView === 'fleet' && (
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3>Fleet Status</h3>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="floating-select">
                <option value="All">All Statuses</option>
                <option value="available">Available</option>
                <option value="in-use">In Trip</option>
                <option value="maintenance">Maintenance</option>
                <option value="out-of-service">Out of Service</option>
              </select>
            </div>

            <div className="vehicle-cards-grid">
              {filtered.map(v => {
                const c = liveCoords[v._id] || {};
                const color = STATUS_COLOR[v.status] || '#6b7280';
                return (
                  <div
                    key={v._id}
                    className={`fleet-card ${selectedVehicle?._id === v._id ? 'selected' : ''}`}
                    onClick={() => handleVehicleClick(v)}
                  >
                    <div className="fc-header">
                      <h4>{v.plateNumber} – {v.model}</h4>
                      <span className="status-badge" style={{ background: `${color}22`, color }}>
                        {v.status === 'in-use' && <span className="live-dot" style={{ background: color }}></span>}
                        {STATUS_LABEL[v.status]}
                      </span>
                    </div>
                    <div className="fc-body">
                      <div className="fc-row"><User size={14} className="fc-icon" /><span>{v.assignedDriverName || '—'}</span></div>
                      <div className="fc-row"><MapPin size={14} className="fc-icon" /><span>{v.location?.name || 'Haramaya University'}</span></div>
                      <div className="fc-row"><Car size={14} className="fc-icon" /><span>{v.type} · {v.capacity} seats · {v.color || ''}</span></div>
                      {v.status === 'in-use' && (
                        <div className="fc-row"><Navigation size={14} className="fc-icon" /><span>{c.speed ?? v.speed} km/h → {v.destination || '—'}</span></div>
                      )}
                      <div className="fc-row">
                        <Activity size={14} className="fc-icon" />
                        <span>Fuel: {v.fuelLevel}% · {v.mileage?.toLocaleString()} km</span>
                      </div>
                    </div>
                    <div className="fc-footer">
                      <span className="timestamp"><Clock size={12} /> {new Date().toLocaleTimeString()}</span>
                      <button className="btn-locate" onClick={e => { e.stopPropagation(); handleVehicleClick(v); }}>
                        <MapPin size={14} /> Locate
                      </button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p style={{ color: '#94a3b8', padding: '2rem' }}>No vehicles match the filter.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Map View ── */}
        {activeView === 'map' && (
          <div className="map-view-panel">
            <div className="map-sidebar">
              <div className="map-sidebar-header">
                <h3>Live Map</h3>
                <button className="btn-center" onClick={() => mapInstanceRef.current?.setView([9.4140, 42.0360], 13)}>
                  <MapPin size={14} /> Campus
                </button>
              </div>
              <div className="legend">
                <h4>Legend</h4>
                {Object.entries(STATUS_LABEL).map(([k, label]) => (
                  <div key={k} className="legend-item">
                    <span className="dot" style={{ background: STATUS_COLOR[k] }}></span> {label}
                  </div>
                ))}
              </div>
              {/* Vehicle list in sidebar */}
              <div style={{ marginTop: 12, overflowY: 'auto', maxHeight: 340 }}>
                {vehicles.map(v => {
                  const c = liveCoords[v._id] || {};
                  const color = STATUS_COLOR[v.status] || '#6b7280';
                  return (
                    <div
                      key={v._id}
                      onClick={() => handleVehicleClick(v)}
                      style={{
                        padding: '10px 12px', cursor: 'pointer', borderRadius: 8, marginBottom: 6,
                        background: selectedVehicle?._id === v._id ? 'rgba(99,102,241,0.1)' : 'transparent',
                        border: `1px solid ${selectedVehicle?._id === v._id ? '#818cf8' : 'transparent'}`,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{v.plateNumber}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{v.model}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 11, color, fontWeight: 600 }}>{STATUS_LABEL[v.status]}</span>
                        {v.status === 'in-use' && <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.speed ?? 0} km/h</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedVehicle && (
                <div className="selected-info-panel">
                  <h4>Selected</h4>
                  <div className="sip-plate">{selectedVehicle.plateNumber}</div>
                  <div className="sip-detail"><strong>Model:</strong> {selectedVehicle.model}</div>
                  <div className="sip-detail"><strong>Driver:</strong> {selectedVehicle.assignedDriverName || '—'}</div>
                  <div className="sip-detail"><strong>Speed:</strong> {liveCoords[selectedVehicle._id]?.speed ?? 0} km/h</div>
                  <div className="sip-detail"><strong>Fuel:</strong> {selectedVehicle.fuelLevel}%</div>
                  {selectedVehicle.destination && <div className="sip-detail"><strong>To:</strong> {selectedVehicle.destination}</div>}
                </div>
              )}
            </div>

            <div className="map-canvas-container">
              {mapError ? (
                <div className="map-error-overlay">
                  <div className="error-content">
                    <AlertTriangle size={48} color="#ef4444" />
                    <h3>Map Loading Failed</h3>
                    <p>Check your internet connection and refresh.</p>
                    <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
                  </div>
                </div>
              ) : (
                <>
                  <div ref={mapRef} className="leaflet-map-canvas"></div>
                  {!mapLoaded && (
                    <div className="map-loading-overlay">
                      <div className="spinner"></div>
                      <p>Loading Map...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
