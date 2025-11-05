const express = require('express');
const {
  startBenchmark,
  getResults,
  healthCheck,
} = require('../controllers/benchmarkController');

const router = express.Router();

// Health check
router.get('/health', healthCheck);

// Benchmark endpoints
router.post('/benchmark', startBenchmark);
router.get('/benchmark/:jobId', getResults);

module.exports = router;
