const express = require('express');
const { executeBenchmark } = require('../services/benchmarkService');

const router = express.Router();

/**
 * Internal endpoint for regional workers
 * POST /internal/benchmark
 */
router.post('/benchmark', async (req, res) => {
  try {
    const { urls, duration, region } = req.body;

    if (!urls || !duration || !region) {
      return res.status(400).json({
        error: 'Missing required fields: urls, duration, region',
      });
    }

    console.log(`[${region}] Received benchmark request for ${urls.length} URLs`);

    // Execute benchmark
    const results = await executeBenchmark(urls, duration, region);

    res.json({
      region,
      results,
    });
  } catch (error) {
    console.error('Error executing benchmark:', error);
    res.status(500).json({ error: 'Failed to execute benchmark' });
  }
});

module.exports = router;
