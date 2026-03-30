import { useState, useEffect } from "react";
import { Search, MapPin, Users, AlertCircle, CheckCircle, XCircle, Building2, GraduationCap, Stethoscope, Truck, FlaskConical, Car, User, Calendar, RefreshCw } from "lucide-react";
import { getRequests, getVehicles, getDrivers, assignTrip, rejectRequest, getCurrentUser } from "../../api/api";
import "./requests.css";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [recommendedVehicles, setRecommendedVehicles] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = getCurrentUser();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqs, vehs, drvs] = await Promise.all([
        getRequests(),
        getVehicles({ status: "available" }).catch(() => []),
        getDrivers().catch(() => []),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setVehicles(Array.isArray(vehs) ? vehs : []);
      setDrivers(Array.isArray(drvs) ? drvs : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getDepartmentIcon = (dept = "") => {
    const d = dept.toLowerCase();
    if (d.includes("medical") || d.includes("health")) return <Stethoscope size={16} className="department-icon" />;
    if (d.includes("research") || d.includes("agri")) return <FlaskConical size={16} className="department-icon" />;
    if (d.includes("social") || d.includes("science") || d.includes("college")) return <GraduationCap size={16} className="department-icon" />;
    if (d.includes("logistic") || d.includes("transport")) return <Truck size={16} className="department-icon" />;
    return <Building2 size={16} className="department-icon" />;
  };

  const getSmartVehicleRecommendations = (request, vehicleList = vehicles) => {
    return vehicleList
      .map(vehicle => {
        let score = 0;
        const reasons = [];
        if (vehicle.capacity >= request.passengers) {
          if (vehicle.capacity <= request.passengers + 5) { score += 50; reasons.push("Optimal capacity match"); }
          else { score += 30; reasons.push("Sufficient capacity"); }
        } else {
          score += 10;
          reasons.push("Below required capacity");
        }

        const reqType = (request.vehicleType || "").toLowerCase();
        if (vehicle.type === reqType) { score += 30; reasons.push(`Matches requested ${vehicle.type}`); }

        if (request.priority === "emergency" && vehicle.type === "van") { score += 20; reasons.push("Suitable for emergency"); }

        return { ...vehicle, score, reasons, matchPercentage: Math.min(100, Math.round((score / 145) * 100)) };
      })
      .sort((a, b) => b.score - a.score);
  };

  const handleApproveClick = async (request) => {
    setRequestToApprove(request);
    setShowAssignmentModal(true);
    setRecommendedVehicles([]);
    try {
      const [freshVehs, freshDrvs] = await Promise.all([
        getVehicles({ status: "available" }).catch(() => []),
        getDrivers().catch(() => []),
      ]);
      const availableVehs = Array.isArray(freshVehs) ? freshVehs : [];
      const availableDrvs = Array.isArray(freshDrvs) ? freshDrvs : [];
      setVehicles(availableVehs);
      setDrivers(availableDrvs);
      // Build driver+vehicle pairs (each driver is permanently linked to a vehicle)
      const pairs = availableDrvs
        .filter(d => d.availability === 'available')
        .map(d => {
          const vehicle = availableVehs.find(v => v.assignedDriver?._id === d._id || v.assignedDriver === d._id);
          return { driver: d, vehicle };
        });
      setRecommendedVehicles(pairs);
    } catch (err) {
      console.error("Failed to fetch assignment data:", err.message);
    }
  };

  const confirmAssignment = async (driverId, vehicleId) => {
    try {
      setActionLoading(true);
      await assignTrip(requestToApprove._id, { driverId, vehicleId });
      setShowAssignmentModal(false);
      setRequestToApprove(null);
      setRecommendedVehicles([]);
      await fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      const updated = await rejectRequest(id, rejectionReason);
      setRequests(prev => prev.map(r => r._id === updated._id ? updated : r));
      setRejectionReason("");
      setShowDetailsModal(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const name = req.requestedBy?.name || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req._id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'All' || req.priority === filterPriority.toLowerCase();
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus.toLowerCase();
    return matchesSearch && matchesPriority && matchesStatus;
  });

  if (loading) return <div className="request-management-layout"><p style={{padding:"2rem",color:"#94a3b8"}}>Loading requests...</p></div>;
  if (error) return <div className="request-management-layout"><p style={{padding:"2rem",color:"#f87171"}}>Error: {error}</p></div>;

  return (
    <div className="request-management-layout">
      <div className="dashboard-header">
        <div>
          <h1>Request Management</h1>
          <p>Review trips, allocate resources, and coordinate drivers</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchData} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="request-workspace-single">
        <div className="requests-panel-full">
          <div className="panel-header">
            <h3>Incoming Requests</h3>
            <span className="request-count">{filteredRequests.length}</span>
          </div>

          <div className="filter-bar">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="filter-select">
              <option value="All">All Priority</option>
              <option value="emergency">Emergency</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="requests-list">
            {filteredRequests.length === 0 && (
              <p style={{padding:"1.5rem",color:"#94a3b8",textAlign:"center"}}>No requests found.</p>
            )}
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className={`request-item priority-${request.priority}`}
                onClick={() => { setSelectedRequest(request); setShowDetailsModal(true); }}
              >
                <div className="request-header">
                  <span className="request-id">{request._id.slice(-6).toUpperCase()}</span>
                  <span className={`status-badge status-${request.status}`}>{request.status}</span>
                </div>
                <div className="requester-info">
                  <h4>{request.requestedBy?.name || '—'}</h4>
                  <span className="department">{getDepartmentIcon(request.requestedBy?.department)} {request.requestedBy?.department || '—'}</span>
                </div>
                <div className="request-meta">
                  <div className="meta-item"><MapPin size={14} /><span>{request.destination}</span></div>
                  <div className="meta-item"><Calendar size={14} /><span>{request.scheduledTime ? new Date(request.scheduledTime).toLocaleString() : '—'}</span></div>
                  <div className="meta-item"><Users size={14} /><span>{request.passengerCount} passengers</span></div>
                </div>
                <div className={`priority-indicator priority-${request.priority}`}>{request.priority}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Details</h2>
              <span className="request-id-large">#{selectedRequest._id.slice(-6).toUpperCase()}</span>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <div className="section-header"><User size={20} /><h4>Requester Info</h4></div>
                <div className="info-grid">
                  <div className="info-item"><label>Name</label><span>{selectedRequest.requestedBy?.name || '—'}</span></div>
                  <div className="info-item"><label>Department</label><span>{selectedRequest.requestedBy?.department || '—'}</span></div>
                  <div className="info-item"><label>Email</label><span>{selectedRequest.requestedBy?.email || '—'}</span></div>
                </div>
              </div>

              <div className="detail-section">
                <div className="section-header"><MapPin size={20} /><h4>Trip Details</h4></div>
                <div className="info-grid">
                  <div className="info-item"><label>Purpose</label><span>{selectedRequest.purpose}</span></div>
                  <div className="info-item"><label>Pickup</label><span>{selectedRequest.pickupLocation}</span></div>
                  <div className="info-item"><label>Destination</label><span>{selectedRequest.destination}</span></div>
                  <div className="info-item"><label>Scheduled</label><span>{selectedRequest.scheduledTime ? new Date(selectedRequest.scheduledTime).toLocaleString() : '—'}</span></div>
                  <div className="info-item"><label>Passengers</label><span>{selectedRequest.passengerCount}</span></div>
                  {selectedRequest.notes && (
                    <div className="info-item"><label>Notes</label><span>{selectedRequest.notes}</span></div>
                  )}
                </div>
              </div>

              {selectedRequest.status === "approved" && selectedRequest.assignedVehicle && (
                <div className="detail-section assignment-section">
                  <div className="section-header"><Car size={20} /><h4>Vehicle Assignment</h4></div>
                  <div className="assignment-card">
                    <div className="vehicle-info">
                      <h5>{selectedRequest.assignedVehicle}</h5>
                      {selectedRequest.assignedDriver && <span>Driver: {selectedRequest.assignedDriver}</span>}
                      {selectedRequest.approvedBy && <span>Approved by: {selectedRequest.approvedBy}</span>}
                    </div>
                    <div className="assignment-status"><CheckCircle size={16} /><span>Assigned</span></div>
                  </div>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="actions-section">
                  <button
                    className="action-btn approve-btn"
                    disabled={actionLoading}
                    onClick={() => { setShowDetailsModal(false); handleApproveClick(selectedRequest); }}
                  >
                    <CheckCircle size={16} /> Approve Request
                  </button>
                  <div className="reject-section">
                    <textarea
                      placeholder="Reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="rejection-textarea"
                    />
                    <button
                      className="action-btn reject-btn"
                      onClick={() => handleReject(selectedRequest._id)}
                      disabled={!rejectionReason.trim() || actionLoading}
                    >
                      <XCircle size={16} /> Reject Request
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                <div className="rejection-display">
                  <AlertCircle size={16} />
                  <span>{selectedRequest.rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Vehicle for Assignment</h2>
              <button className="close-btn" onClick={() => setShowAssignmentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="request-summary">
                <h3>Request: #{requestToApprove?._id.slice(-6).toUpperCase()}</h3>
                <div className="summary-details">
                  <span><strong>Requester:</strong> {requestToApprove?.requestedBy?.name || '—'}</span>
                  <span><strong>Passengers:</strong> {requestToApprove?.passengerCount}</span>
                  <span><strong>Destination:</strong> {requestToApprove?.destination}</span>
                  <span><strong>Scheduled:</strong> {requestToApprove?.scheduledTime ? new Date(requestToApprove.scheduledTime).toLocaleString() : '—'}</span>
                  <span><strong>Priority:</strong> {requestToApprove?.priority}</span>
                </div>
              </div>

              <div className="recommendations-section">
                <h3>Available Drivers & Vehicles ({recommendedVehicles.length})</h3>
                {recommendedVehicles.length === 0 && (
                  <p style={{color:"#94a3b8",padding:"1rem"}}>No available drivers with assigned vehicles found.</p>
                )}
                <div className="vehicle-recommendations">
                  {recommendedVehicles.map(({ driver, vehicle }, index) => (
                    <div key={driver._id} className={`recommendation-card ${index === 0 ? "best-match" : ""}`}>
                      <div className="recommendation-header">
                        <div className="vehicle-info">
                          <h4>{driver.name}</h4>
                          <span className="vehicle-type">
                            Driver · {driver.licenseNumber || 'License on file'}
                          </span>
                        </div>
                        <span className={`status-badge status-${driver.availability}`}>{driver.availability}</span>
                      </div>
                      {vehicle ? (
                        <div className="driver-info" style={{marginTop:8}}>
                          <span><strong>Assigned Vehicle:</strong> {vehicle.plateNumber} — {vehicle.model} ({vehicle.type})</span>
                        </div>
                      ) : (
                        <div className="driver-info" style={{marginTop:8,color:'#f59e0b'}}>
                          <span>⚠️ No vehicle permanently assigned to this driver</span>
                        </div>
                      )}
                      <button
                        className={`assign-btn ${index === 0 ? "primary" : "secondary"}`}
                        onClick={() => confirmAssignment(driver._id, vehicle?._id)}
                        disabled={actionLoading || !vehicle}
                        style={{marginTop:12}}
                      >
                        {index === 0 ? "⭐ Assign (Best Match)" : "Assign Driver & Vehicle"}
                      </button>
                    </div>
                  ))}

                  {recommendedVehicles.length === 0 && vehicles.length > 0 && (
                    <div className="no-vehicles">
                      <p>⚠️ Drivers exist but none have a permanently assigned vehicle. Please assign vehicles to drivers in the Admin panel first.</p>
                    </div>
                  )}

                  {vehicles.length === 0 && drivers.length === 0 && (
                    <div className="no-vehicles">
                      <p>⚠️ No available drivers or vehicles at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
