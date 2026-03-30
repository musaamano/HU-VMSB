import { useState, useEffect } from 'react';
import driverService from '../../../services/driverService';
import './DriverComplaints.css';

const DriverComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        try {
            const data = await driverService.getComplaints();
            setComplaints(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load complaints:', error);
            setLoading(false);
        }
    };

    const handleRespond = async (complaintId) => {
        if (!response.trim()) {
            alert('Please enter a response');
            return;
        }

        setSubmitting(true);
        try {
            await driverService.respondToComplaint(complaintId, response);
            setResponse('');
            setSelectedComplaint(null);
            loadComplaints();
        } catch (error) {
            console.error('Failed to submit response:', error);
            alert('Failed to submit response');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading complaints...</div>;

    return (
        <div className="driver-complaints">
            <h2>Complaints</h2>

            {complaints.length === 0 ? (
                <p className="no-complaints">No complaints</p>
            ) : (
                <div className="complaints-list">
                    {complaints.map(complaint => (
                        <div key={complaint.id} className={`complaint-card ${complaint.status}`}>
                            <div className="complaint-header">
                                <span className="complaint-id">Complaint #{complaint.id}</span>
                                <span className={`status ${complaint.status}`}>{complaint.status}</span>
                            </div>

                            <div className="complaint-content">
                                <p><strong>From:</strong> {complaint.complainantName}</p>
                                <p><strong>Date:</strong> {new Date(complaint.submittedAt).toLocaleDateString()}</p>
                                <p><strong>Description:</strong></p>
                                <p className="complaint-description">{complaint.description}</p>

                                {complaint.driverResponse && (
                                    <div className="driver-response">
                                        <strong>Your Response:</strong>
                                        <p>{complaint.driverResponse}</p>
                                    </div>
                                )}

                                {complaint.status === 'pending' && (
                                    <button
                                        onClick={() => setSelectedComplaint(complaint)}
                                        className="btn-respond"
                                    >
                                        Respond
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedComplaint && (
                <div className="response-modal">
                    <div className="modal-content">
                        <h3>Respond to Complaint #{selectedComplaint.id}</h3>
                        <p className="complaint-text">{selectedComplaint.description}</p>

                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Enter your response..."
                            rows="5"
                        />

                        <div className="modal-actions">
                            <button
                                onClick={() => handleRespond(selectedComplaint.id)}
                                disabled={submitting}
                                className="btn-primary"
                            >
                                Submit Response
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedComplaint(null);
                                    setResponse('');
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverComplaints;
