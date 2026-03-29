console.log('=== Basic Node.js Test ===');
console.log('Process started successfully');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

try {
  console.log('Loading Express...');
  const express = require('express');
  console.log('✅ Express loaded successfully');
  
  console.log('Creating app...');
  const app = express();
  console.log('✅ App created successfully');
  
  console.log('Setting up routes...');
  app.get('/test', (req, res) => {
    res.json({ status: 'OK', message: 'Basic test working!' });
  });
  console.log('✅ Routes configured');
  
  const PORT = 3007;
  app.listen(PORT, () => {
    console.log(`✅ Server started successfully on port ${PORT}`);
    console.log(`✅ Test at: http://localhost:${PORT}/test`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}

console.log('=== End Basic Test ===');
