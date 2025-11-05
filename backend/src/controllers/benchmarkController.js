const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for jobs
// For production, replace with Redis or Cloud Firestore
const jobs = new Map();

// Regional worker URLs from environment variables
const REGIONAL_WORKERS = {
  asia: process.env.ASIA_WORKER_URL,
  europe: process.env.EUROPE_WORKER_URL,
  us: process.env.US_WORKER_URL,
};

/**
 * Start a new benchmark job
 * POST /api/benchmark
 */
async function startBenchmark(req, res) {
  try {
    const { urls, duration = 30, regions = ['asia', 'europe', 'us'] } = req.body;

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0 || urls.length > 5) {
      return res.status(400).json({
        error: 'Please provide 1-5 URLs',
      });
    }

    // Validate duration
    const minDuration = parseInt(process.env.MIN_DURATION || '10', 10);
    const maxDuration = parseInt(process.env.MAX_DURATION || '60', 10);
    if (duration < minDuration || duration > maxDuration) {
      return res.status(400).json({
        error: `Duration must be between ${minDuration} and ${maxDuration} seconds`,
      });
    }

    // Validate regions
    const validRegions = Object.keys(REGIONAL_WORKERS);
    const invalidRegions = regions.filter((r) => !validRegions.includes(r));
    if (invalidRegions.length > 0) {
      return res.status(400).json({
        error: `Invalid regions: ${invalidRegions.join(', ')}`,
      });
    }

    // Create job
    const jobId = uuidv4();
    jobs.set(jobId, {
      id: jobId,
      status: 'running',
      urls,
      regions,
      duration,
      createdAt: new Date(),
      results: [],
    });

    // Start benchmark asynchronously (don't await)
    runBenchmarkAsync(jobId, urls, duration, regions);

    // Return job ID immediately
    res.json({
      jobId,
      status: 'running',
    });
  } catch (error) {
    console.error('Error starting benchmark:', error);
    res.status(500).json({ error: 'Failed to start benchmark' });
  }
}

/**
 * Get benchmark results
 * GET /api/benchmark/:jobId
 */
function getResults(req, res) {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    urls: job.urls,
    regions: job.regions,
    duration: job.duration,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    results: job.results,
    error: job.error,
  });
}

/**
 * Run benchmark asynchronously
 * Calls all regional workers in parallel
 */
async function runBenchmarkAsync(jobId, urls, duration, regions) {
  try {
    console.log(`[Job ${jobId}] Starting benchmark for ${urls.length} URLs in ${regions.length} regions`);

    // Call all regional workers in parallel
    const promises = regions.map((region) => callRegionalWorker(region, urls, duration));

    // Wait for all workers to complete
    const results = await Promise.all(promises);

    // Flatten results from all regions
    const allResults = results.flat();

    // Update job status
    const job = jobs.get(jobId);
    job.status = 'completed';
    job.completedAt = new Date();
    job.results = allResults;

    console.log(`[Job ${jobId}] Completed successfully with ${allResults.length} results`);
  } catch (error) {
    console.error(`[Job ${jobId}] Failed:`, error.message);

    // Update job with error
    const job = jobs.get(jobId);
    job.status = 'failed';
    job.completedAt = new Date();
    job.error = error.message;
  }
}

/**
 * Call a regional worker
 */
async function callRegionalWorker(region, urls, duration) {
  const workerUrl = REGIONAL_WORKERS[region];

  if (!workerUrl) {
    throw new Error(`Worker URL not configured for region: ${region}`);
  }

  console.log(`[${region}] Calling worker at ${workerUrl}`);

  try {
    const response = await axios.post(
      `${workerUrl}/internal/benchmark`,
      {
        urls,
        duration,
        region,
      },
      {
        timeout: (duration + 10) * 1000, // Add 10s buffer
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    console.log(`[${region}] Worker completed successfully`);
    return response.data.results;
  } catch (error) {
    console.error(`[${region}] Worker failed:`, error.message);
    throw new Error(`${region} worker failed: ${error.message}`);
  }
}

/**
 * Health check endpoint
 * GET /api/health
 */
function healthCheck(req, res) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: process.env.REGION || 'orchestrator',
  });
}

module.exports = {
  startBenchmark,
  getResults,
  healthCheck,
};
