require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const emailRoutes = require('./routes/email');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve PDF files directory
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Create pdfs directory if it doesn't exist
const fs = require('fs');
const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}

// Routes
app.use('/api/email', emailRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('PDF Email API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
