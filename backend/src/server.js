/**
 * "কিওর হসপিটাল" (Cure Hospital) - Smart Hospital Management System
 * Backend REST API & Single-Service Static Web Server (Node.js + Express.js)
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const errorHandler = require('./middleware/errorHandler');

// Core Problem 5 Route imports
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Path to React production build
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development inspection)
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// System Health & Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'কিওর হসপিটাল (Cure Hospital) Management System',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
    port: PORT,
  });
});

// Core API Routes (Problem 5: Doctors, Slots, Appointments, Tracking)
app.use('/api', appointmentRoutes);
app.use('/api/auth', authRoutes);

// Explicit 404 for unhandled API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `অনুরোধকৃত এপিআই রাউট পাওয়া যায়নি: ${req.method} ${req.originalUrl}`,
  });
});

// Serve React production build static assets
app.use(express.static(frontendDistPath));

// Fallback all other GET requests to React's index.html (SPA client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build not found. Please run "npm run build" to compile frontend assets.');
  }
});

// Centralized Error Middleware
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log('====================================================');
    console.log(`🏥 কিওর হসপিটাল (Cure Hospital) Backend & Web Server`);
    console.log(`🚀 Running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`📡 Health Check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
    console.log(`🩺 Problem 5 Endpoints: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/doctors`);
    console.log(`📦 Serving React Build from: ${frontendDistPath}`);
    console.log('====================================================');
  });
}

module.exports = app;
