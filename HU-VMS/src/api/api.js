const BASE_URL = '/api';

const getToken = () => localStorage.getItem('authToken');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const req = async (url, options = {}) => {
  const res = await fetch(url, { ...options, headers: { ...headers(), ...options.headers } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

export const login = async (username, password, role) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

export const getVehicles   = (params) => {
  const qs = params?.status ? `?status=${params.status}` : '';
  const user = getCurrentUser();
  const base = user?.role === 'ADMIN' ? `${BASE_URL}/admin/vehicles` : `${BASE_URL}/transport/vehicles`;
  return req(`${base}${qs}`);
};
export const createVehicle = (d) => req(`${BASE_URL}/admin/vehicles`, { method: 'POST', body: JSON.stringify(d) });
export const updateVehicle = (id, d) => req(`${BASE_URL}/admin/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteVehicle = (id) => req(`${BASE_URL}/admin/vehicles/${id}`, { method: 'DELETE' });

export const getDrivers   = () => {
  const user = getCurrentUser();
  const base = user?.role === 'ADMIN' ? `${BASE_URL}/admin/drivers` : `${BASE_URL}/transport/drivers`;
  return req(base);
};
export const createDriver = (d) => req(`${BASE_URL}/admin/users`, { method: 'POST', body: JSON.stringify({ ...d, role: 'DRIVER' }) });
export const updateDriver = (id, d) => req(`${BASE_URL}/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteDriver = (id) => req(`${BASE_URL}/admin/users/${id}`, { method: 'DELETE' });

export const getUsers      = () => req(`${BASE_URL}/admin/users`);
export const registerUser  = (d) => req(`${BASE_URL}/admin/users`, { method: 'POST', body: JSON.stringify(d) });
export const updateUser    = (id, d) => req(`${BASE_URL}/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteUser    = (id) => req(`${BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
export const resetUserPassword = (id, newPassword) => req(`${BASE_URL}/auth/change-password`, { method: 'PUT', body: JSON.stringify({ newPassword }) });
export const resetUsername = (id, newUsername) => req(`${BASE_URL}/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ username: newUsername }) });

export const getRequests    = () => req(`${BASE_URL}/transport/requests`);
export const createRequest  = (d) => req(`${BASE_URL}/user/requests`, { method: 'POST', body: JSON.stringify(d) });
export const updateRequest  = (id, d) => req(`${BASE_URL}/transport/requests/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const approveRequest = (id, d) => req(`${BASE_URL}/transport/requests/${id}/approve`, { method: 'PUT', body: JSON.stringify(d || {}) });
export const rejectRequest  = (id, reason) => req(`${BASE_URL}/transport/requests/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
export const assignTrip     = (id, d) => req(`${BASE_URL}/transport/trips/${id}/assign`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteRequest  = (id) => req(`${BASE_URL}/user/requests/${id}`, { method: 'DELETE' });
export const startTrip      = (id) => req(`${BASE_URL}/transport/trips/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'started' }) });
export const completeTrip   = (id) => req(`${BASE_URL}/transport/trips/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) });
export const cancelAdminTrip = (id, reason) => req(`${BASE_URL}/admin/trips/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) });

// Fuel request flow: Driver submits → Admin approves → Fuel station dispenses
export const getAdminFuelRequests    = () => req(`${BASE_URL}/admin/fuel-requests`);
export const approveAdminFuelRequest = (id) => req(`${BASE_URL}/admin/fuel-requests/${id}/approve`, { method: 'PUT' });
export const rejectAdminFuelRequest  = (id, reason) => req(`${BASE_URL}/admin/fuel-requests/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });

// User notifications
export const getUserNotifications   = () => req(`${BASE_URL}/user/notifications`);
export const markNotificationRead   = (id) => req(`${BASE_URL}/user/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsRead = () => req(`${BASE_URL}/user/notifications/read-all`, { method: 'PUT' });

// Vehicle issues / maintenance
export const getVehicleIssues  = () => req(`${BASE_URL}/transport/vehicle-issues`);
export const updateVehicleIssue = (id, d) => req(`${BASE_URL}/transport/vehicle-issues/${id}`, { method: 'PUT', body: JSON.stringify(d) });

export const getComplaints   = () => req(`${BASE_URL}/transport/complaints`);
export const createComplaint = (d) => req(`${BASE_URL}/user/complaints`, { method: 'POST', body: JSON.stringify(d) });
export const updateComplaint = (id, d) => req(`${BASE_URL}/transport/complaints/${id}/respond`, { method: 'PUT', body: JSON.stringify(d) });

export const getVehicleUsageReport    = () => req(`${BASE_URL}/admin/reports/trips`);
export const getDriverActivityReport  = () => req(`${BASE_URL}/admin/reports/driver-performance`);
export const getRequestsSummaryReport = () => req(`${BASE_URL}/transport/reports`);
export const sendReport               = async () => ({ success: true });
export const getReceivedReports       = async () => [];
export const submitReportRequest      = async () => ({ success: true });
export const getReportRequests        = async () => [];
export const updateReportRequest      = async () => ({ success: true });

export const getFuelRecords    = () => req(`${BASE_URL}/admin/fuel-records`);
export const createFuelRecord  = (d) => req(`${BASE_URL}/admin/fuel-records`, { method: 'POST', body: JSON.stringify(d) });
export const deleteFuelRecord  = (id) => req(`${BASE_URL}/admin/fuel-records/${id}`, { method: 'DELETE' });
