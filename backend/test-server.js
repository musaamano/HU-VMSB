require('dotenv').config();
console.log('PORT from env:', process.env.PORT);
console.log('MONGO_URI from env:', process.env.MONGO_URI);

const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', port: process.env.PORT });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
