const express = require('express');
const cors = require('cors');
const path = require('path');
const musicRoutes = require('./routes/music');
const { initializeSongs, startAutoSync } = require('./models/Song');

console.log('Loading music routes...');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/music', musicRoutes);

console.log('Routes loaded successfully');

// Initialize songs and start auto-sync
initializeSongs().then(() => {
  // Start auto-sync every 60 seconds
  startAutoSync(60000);
}).catch(err => {
  console.error('Error initializing songs:', err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/music`);
  console.log(`API docs at http://localhost:${PORT}/api/music/docs`);
});