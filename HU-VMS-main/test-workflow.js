import axios from 'axios';

const BASE_URL = 'http://localhost:3007/api';

// Test credentials
const credentials = {
    admin: { username: 'admin', password: 'admin123', role: 'ADMIN' },
    transport: { username: 'transport1', password: 'pass123', role: 'TRANSPORT' },
    driver: { username: 'driver1', password: 'pass123', role: 'DRIVER' },
    user: { username: 'user1', password: 'pass123', role: 'USER' },
    fuel: { username: 'fuel1', password: 'pass123', role: 'FUEL_OFFICER' },
    maintenance: { username: 'maintenance1', password: 'pass123', role: 'MAINTENANCE' }
};

let tokens = {};

async function login(userType) {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, credentials[userType]);
        tokens[userType] = response.data.token;
        console.log(`✅ ${userType} logged in successfully`);
        return response.data;
    } catch (error) {
        console.error(`❌ ${userType} login failed:`, error.response?.data?.message || error.message);
        throw error;
    }
}

async function makeRequest(method, url, data = null, userType) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: { Authorization: `Bearer ${tokens[userType]}` }
        };
        if (data) config.data = data;
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`❌ API call failed: ${method} ${url}`, error.response?.data?.message || error.message);
        throw error;
    }
}

async function testWorkflow() {
    console.log('🚀 Starting HU-VMS Workflow Test\n');

    try {
        // Phase 1: Authentication
        console.log('📋 Phase 1: Authentication');
        await Promise.all([
            login('admin'),
            login('transport'),
            login('driver'),
            login('user'),
            login('fuel'),
            login('maintenance')
        ]);
        console.log('');

        // Phase 2: Trip Request
        console.log('📋 Phase 2: Trip Request');
        const tripRequest = {
            pickupLocation: 'Haramaya University Main Gate',
            destination: 'Addis Ababa Conference Center',
            purpose: 'Academic Conference',
            passengerCount: 3,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        const trip = await makeRequest('POST', '/user/requests', tripRequest, 'user');
        console.log('✅ Trip request submitted:', trip.trip.tripId);
        console.log('');

        console.log('\n🎉 HU-VMS Workflow Test Started Successfully!');
        console.log('Basic authentication and trip request submission working.');

    } catch (error) {
        console.error('\n❌ Workflow test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testWorkflow();