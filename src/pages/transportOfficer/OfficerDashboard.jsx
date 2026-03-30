import "./OfficerDashboard.css";

export default function TransportOfficerDashboard() {
  return (
    <div className="to-dashboard">

      {/* HEADER */}
      <header className="to-dash-header">
        <h1>Dashboard Overview</h1>
        <p>Transport operations summary</p>
      </header>

      {/* STATS */}
      <section className="to-dash-stats">
        <div className="dash-card">
          <span>Available Vehicles</span>
          <h2>24</h2>
        </div>

        <div className="dash-card">
          <span>Pending Requests</span>
          <h2>8</h2>
        </div>

        <div className="dash-card">
          <span>Active Trips</span>
          <h2>12</h2>
        </div>

        <div className="dash-card">
          <span>Complaints</span>
          <h2>3</h2>
        </div>
      </section>

      {/* PANELS */}
      <section className="to-dash-panels">

        {/* RECENT REQUESTS */}
        <div className="dash-panel">
          <h3>Recent Requests</h3>

          <div className="request-item">
            <strong>Staff Transport</strong>
            <span>Destination: Campus B</span>
          </div>

          <div className="request-item">
            <strong>Goods Delivery</strong>
            <span>Destination: Warehouse</span>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="dash-panel">
          <h3>System Status</h3>

          <div className="status-item">
            <span>GPS Tracking</span>
            <span className="online">● Online</span>
          </div>

          <div className="status-item">
            <span>Request Service</span>
            <span className="online">● Online</span>
          </div>
        </div>

      </section>
    </div>
  );
}