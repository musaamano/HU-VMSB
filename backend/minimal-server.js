console.log('Starting minimal server...');

const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received');
  res.json({ success: true, token: 'test-token', user: { name: 'Test Driver', role: 'DRIVER' } });
});

app.post('/api/driver/vehicle/issue', (req, res) => {
  console.log('Vehicle issue request:', req.body);
  res.json({ success: true, message: 'Issue submitted', issue: { id: '123', status: 'reported' } });
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('✅ Login endpoint: http://localhost:3005/api/auth/login');
  console.log('✅ Issue endpoint: http://localhost:3005/api/driver/vehicle/issue');
});
