require('dotenv').config();
const express = require('express');
const cors = require('cors');
const benchmarkRoutes = require('./routes/benchmark');
const workerRoutes = require('./routes/worker');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const REGION = process.env.REGION || 'orchestrator';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', benchmarkRoutes); // Public API routes
app.use('/internal', workerRoutes); // Internal worker routes

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Performance Benchmark API',
    version: '1.0.0',
    region: REGION,
    environment: NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Region: ${REGION}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  if (REGION === 'orchestrator') {
    console.log('🎯 Mode: Orchestrator');
    console.log('   Asia Worker:', process.env.ASIA_WORKER_URL || 'NOT CONFIGURED');
    console.log('   Europe Worker:', process.env.EUROPE_WORKER_URL || 'NOT CONFIGURED');
    console.log('   US Worker:', process.env.US_WORKER_URL || 'NOT CONFIGURED');
  } else {
    console.log(`🎯 Mode: Regional Worker (${REGION})`);
  }
});

module.exports = app;
