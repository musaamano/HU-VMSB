import { useState } from 'react';
import './TripAuthorization.css';

const TripAuthorization = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    // Mock trip authorization database
    const tripDatabase = [
        {
            tripId: 'TRIP-2024-001',
            plateNumber: 'HU-2045',
            vehicle: 'Toyota Hilux',
            driver: 'John Smith',
            department: 'Engineering',
            purpose: 'Field Research - Haramaya Campus',
            destination: 'Haramaya Campus',
            startDate: '2026-03-09',
            endDate: '2026-03-09',
            startTime: '08:00',
            endTime: '17:00',
            approvedBy: 'Dr. Ahmed Hassan',
            approvalDate: '2026-03-08',
            status: 'Approved',
            passengers: 4
        },
        {
            tripId: 'TRIP-2024-002',
            plateNumber: 'HU-3021',
            vehicle: 'Isuzu D-Max',
            driver: 'Sarah Johnson',
            department: 'Agriculture',
            purpose: 'Farm Equipment Delivery',
            destination: 'University Farm',
            startDate: '2026-03-09',
            endDate: '2026-03-10',
            startTime: '07:00',
            endTime: '18:00',
            approvedBy: 'Prof. Mohammed Ali',
            approvalDate: '2026-03-07',
            status: 'Approved',
            passengers: 2
        },
        {
            tripId: 'TRIP-2024-003',
            plateNumber: 'HU-1567',
            vehicle: 'Toyota Land Cruiser',
            driver: 'Mike Wilson',
            department: 'Administration',
            purpose: 'Official Meeting - Ministry of Education',
            destination: 'Addis Ababa',
            startDate: '2026-03-09',
            endDate: '2026-03-11',
            startTime: '06:00',
            endTime: '20:00',
            approvedBy: 'Vice President',
            approvalDate: '2026-03-06',
            status: 'Approved',
            passengers: 3
        }
    ];

    const handleSearch = (e) => {
        e.preventDefault();

        if (!searchQuery.trim()) {
            alert('Please enter a plate number or trip ID');
            return;
        }

        const result = tripDatabase.find(
            trip => trip.plateNumber.toLowerCase() === searchQuery.toLowerCase() ||
                trip.tripId.toLowerCase() === searchQuery.toLowerCase()
        );

        if (result) {
            setSearchResult(result);
        } else {
            setSearchResult({ notFound: true });
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResult(null);
    };

    const handleAuthorizeEntry = () => {
        alert(`Trip ${searchResult.tripId} authorized for entry`);
        setSearchResult(null);
        setSearchQuery('');
    };

    const handleRejectEntry = () => {
        alert(`Trip ${searchResult.tripId} entry rejected`);
        setSearchResult(null);
        setSearchQuery('');
    };

    const getStatusBadge = (status) => {
        const statusClass = status?.toLowerCase();
        return <span className={`gate-status-badge ${statusClass}`}>{status}</span>;
    };

    return (
        <div className="trip-authorization-page">
            <div className="gate-page-header">
                <h2>Trip Authorization Verification</h2>
                <p>Verify approved trip requests from transport office</p>
            </div>

            {/* Search Bar */}
            <div className="trip-search-container">
                <form onSubmit={handleSearch} className="trip-search-form">
                    <div className="search-input-group">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Enter plate number or trip ID (e.g., HU-2045 or TRIP-2024-001)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="trip-search-input"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="search-clear-btn"
                                onClick={handleClearSearch}
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <button type="submit" className="gate-btn-primary">
                        Verify Trip
                    </button>
                </form>
            </div>

            {/* Search Result */}
            {searchResult && (
                <div className="trip-result-container">
                    {searchResult.notFound ? (
                        <div className="trip-not-found">
                            <span className="not-found-icon">❌</span>
                            <h3>No Authorized Trip Found</h3>
                            <p>No approved trip found for: <strong>{searchQuery}</strong></p>
                            <p className="not-found-hint">This vehicle does not have an approved trip request</p>
                            <button className="gate-btn-secondary" onClick={handleClearSearch}>
                                Search Again
                            </button>
                        </div>
                    ) : (
                        <div className="trip-info-card">
                            <div className="trip-card-header">
                                <div className="trip-id-display">
                                    {searchResult.tripId}
                                </div>
                                {getStatusBadge(searchResult.status)}
                            </div>

                            <div className="trip-info-grid">
                                <div className="info-section">
                                    <h4>Vehicle & Driver Information</h4>
                                    <div className="info-row">
                                        <span className="info-label">Plate Number:</span>
                                        <span className="info-value">{searchResult.plateNumber}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Vehicle:</span>
                                        <span className="info-value">{searchResult.vehicle}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Driver:</span>
                                        <span className="info-value">{searchResult.driver}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Department:</span>
                                        <span className="info-value">{searchResult.department}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Passengers:</span>
                                        <span className="info-value">{searchResult.passengers}</span>
                                    </div>
                                </div>

                                <div className="info-section">
                                    <h4>Trip Details</h4>
                                    <div className="info-row">
                                        <span className="info-label">Purpose:</span>
                                        <span className="info-value">{searchResult.purpose}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Destination:</span>
                                        <span className="info-value">{searchResult.destination}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Start Date:</span>
                                        <span className="info-value">{searchResult.startDate}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">End Date:</span>
                                        <span className="info-value">{searchResult.endDate}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Time:</span>
                                        <span className="info-value">{searchResult.startTime} - {searchResult.endTime}</span>
                                    </div>
                                </div>

                                <div className="info-section">
                                    <h4>Authorization Details</h4>
                                    <div className="info-row">
                                        <span className="info-label">Approved By:</span>
                                        <span className="info-value">{searchResult.approvedBy}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Approval Date:</span>
                                        <span className="info-value">{searchResult.approvalDate}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Status:</span>
                                        <span className="info-value">{searchResult.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="authorization-indicator">
                                <span className="auth-icon">✓</span>
                                <span className="auth-text">Trip Authorized by Transport Office</span>
                            </div>

                            <div className="trip-card-actions">
                                <button className="gate-btn-success" onClick={handleAuthorizeEntry}>
                                    <span>✓</span> Authorize Entry
                                </button>
                                <button className="gate-btn-danger" onClick={handleRejectEntry}>
                                    <span>✗</span> Reject Entry
                                </button>
                                <button className="gate-btn-secondary" onClick={handleClearSearch}>
                                    <span>🔍</span> Search Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Today's Authorized Trips */}
            {!searchResult && (
                <div className="authorized-trips-section">
                    <h3>Today's Authorized Trips</h3>
                    <div className="authorized-trips-grid">
                        {tripDatabase.map((trip) => (
                            <div
                                key={trip.tripId}
                                className="authorized-trip-card"
                                onClick={() => {
                                    setSearchQuery(trip.plateNumber);
                                    setSearchResult(trip);
                                }}
                            >
                                <div className="trip-card-top">
                                    <span className="trip-plate">{trip.plateNumber}</span>
                                    {getStatusBadge(trip.status)}
                                </div>
                                <div className="trip-card-info">
                                    <div className="trip-driver">{trip.driver}</div>
                                    <div className="trip-destination">📍 {trip.destination}</div>
                                    <div className="trip-time">🕐 {trip.startTime} - {trip.endTime}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripAuthorization;
