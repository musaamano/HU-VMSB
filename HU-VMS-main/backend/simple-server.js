const express = require('express');
const app = express();
app.use(express.json());

console.log('Starting simple server...');

app.post('/api/auth/login', (req, res) => {
  console.log('Login hit');
  res.json({ success: true, token: 'mock-token', user: { name: 'Test Driver', role: 'DRIVER' } });
});

app.post('/api/driver/vehicle/issue', (req, res) => {
  console.log('Issue hit:', req.body);
  res.json({ success: true, message: 'Issue submitted', issue: { id: '123', ...req.body } });
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
