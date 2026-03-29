// Simple test to see if Node.js can run in this directory
console.log('=== Node.js Test ===');
console.log('Current working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);

try {
  const express = require('express');
  console.log('✅ Express loaded successfully');
  
  const app = express();
  console.log('✅ Express app created');
  
  app.get('/test', (req, res) => {
    res.json({ status: 'OK', message: 'Server is working!' });
  });
  
  console.log('✅ Route configured');
  console.log('✅ Everything looks good - server should start');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('=== End Test ===');
