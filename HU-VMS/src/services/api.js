// API base URL configuration
const API_BASE_RAW = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = API_BASE_RAW.replace(/\/$/, ''); // strip trailing slash

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const requestUrl = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    try {
        const response = await fetch(requestUrl, config);
        console.log('API Request:', requestUrl, 'status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.statusText} (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
};

export const api = {
    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
    post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    put: (endpoint, data) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export default api;
