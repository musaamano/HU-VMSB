import { useState, useEffect } from 'react';
import driverService from '../../../services/driverService';
import './TripHistory.css';

const TripHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await driverService.getTripHistory();
            setHistory(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load trip history:', error);
            setLoading(false);
        }
    };

    const filteredHistory = filter === 'all'
        ? history
        : history.filter(trip => trip.status === filter);

    if (loading) return <div className="loading">Loading history...</div>;

    return (
        <div className="trip-history">
            <h2>Trip History</h2>

            <div className="filter-buttons">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={filter === 'completed' ? 'active' : ''}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </button>
                <button
                    className={filter === 'cancelled' ? 'active' : ''}
                    onClick={() => setFilter('cancelled')}
                >
                    Cancelled
                </button>
            </div>

            <div className="history-list">
                {filteredHistory.map(trip => (
                    <div key={trip.id} className="history-card">
                        <div className="history-header">
                            <span>Trip #{trip.id}</span>
                            <span className={`status ${trip.status}`}>{trip.status}</span>
                        </div>
                        <p><strong>From:</strong> {trip.pickupLocation}</p>
                        <p><strong>To:</strong> {trip.destination}</p>
                        <p><strong>Date:</strong> {new Date(trip.completedAt).toLocaleDateString()}</p>
                        {trip.fuelUsed && <p><strong>Fuel Used:</strong> {trip.fuelUsed}L</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TripHistory;
