import './AcceptTrip.css';

const AcceptTrip = ({ trip, onAccept, onCancel }) => {
    const handleConfirm = () => {
        onAccept(trip.id);
        onCancel();
    };

    return (
        <div className="accept-trip-modal">
            <div className="modal-content">
                <h3>Confirm Trip Acceptance</h3>

                <div className="trip-summary">
                    <p><strong>Trip ID:</strong> {trip.id}</p>
                    <p><strong>Pickup:</strong> {trip.pickupLocation}</p>
                    <p><strong>Destination:</strong> {trip.destination}</p>
                    <p><strong>Scheduled Time:</strong> {new Date(trip.scheduledTime).toLocaleString()}</p>
                    <p><strong>Passenger:</strong> {trip.passengerName}</p>
                </div>

                <div className="modal-actions">
                    <button onClick={handleConfirm} className="btn-confirm">
                        Confirm Accept
                    </button>
                    <button onClick={onCancel} className="btn-cancel">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcceptTrip;
