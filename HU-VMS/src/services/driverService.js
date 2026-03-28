import api from './api';

const BASE = '/driver';

export const driverService = {
  // Trip Management
  getAssignedTrips: () => api.get(`${BASE}/trips/assigned`),
  getTripHistory:   () => api.get(`${BASE}/trips/history`),
  acceptTrip:       (id) => api.post(`${BASE}/trips/${id}/accept`),
  rejectTrip:       (id, reason) => api.post(`${BASE}/trips/${id}/reject`, { reason }),
  updateTripStatus: (id, status, extra = {}) => api.put(`${BASE}/trips/${id}/status`, { status, ...extra }),

  // Vehicle
  getVehicleInfo: () => api.get(`${BASE}/vehicle`),

  // Notifications
  getNotifications:         () => api.get(`${BASE}/notifications`),
  markNotificationRead:     (id) => api.put(`${BASE}/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put(`${BASE}/notifications/read-all`),

  // Fuel — driver submits request → Admin approves → Fuel station dispenses
  submitFuelRequest: (data) => api.post(`${BASE}/fuel/refill`, data),
  getFuelHistory:    () => api.get(`${BASE}/fuel/history`),

  // GPS
  updateLocation: (location) => api.post(`${BASE}/location`, location),

  // Vehicle Issues — driver reports mechanical problem → Transport/Maintenance
  reportIssue:       (data) => api.post(`${BASE}/vehicle/issue`, data),
  getVehicleIssues:  () => api.get(`${BASE}/vehicle/issues`),

  // Complaints
  getComplaints:      () => api.get(`${BASE}/complaints`),
  respondToComplaint: (id, response) => api.post(`${BASE}/complaints/${id}/respond`, { response }),
  submitComplaint:    (data) => api.post(`${BASE}/complaints/submit`, data),

  // Gate
  confirmExit:  (data) => api.post(`${BASE}/gate/exit`, data),
  confirmEntry: (data) => api.post(`${BASE}/gate/entry`, data),

  // Availability
  getAvailability:    () => api.get(`${BASE}/availability`),
  updateAvailability: (status) => api.put(`${BASE}/availability`, { status }),

  // Profile
  getProfile:    () => api.get(`${BASE}/profile`),
  updateProfile: (data) => api.put(`${BASE}/profile`, data),
};

export default driverService;
