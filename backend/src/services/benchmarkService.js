const axios = require('axios');

/**
 * Execute benchmark for given URLs and duration
 */
async function executeBenchmark(urls, duration, region) {
  const startTime = Date.now();
  const results = [];

  console.log(`[${region}] Starting benchmark for ${urls.length} URLs, duration: ${duration}s`);

  // Run for specified duration
  while (Date.now() - startTime < duration * 1000) {
    // Test all URLs concurrently
    const promises = urls.map((url) => testURL(url));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Small delay to avoid overwhelming targets
    await new Promise((resolve) => { setTimeout(resolve, 100); });
  }

  console.log(`[${region}] Completed ${results.length} total requests`);

  // Calculate metrics for each URL
  return calculateMetricsPerURL(results, region);
}

/**
 * Test a single URL and measure latency
 */
async function testURL(url) {
  const startTime = Date.now();

  try {
    await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Benchmark-Tool/1.0',
      },
      // Don't follow redirects to measure actual endpoint performance
      maxRedirects: 5,
    });

    return {
      url,
      latency: Date.now() - startTime,
      success: true,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      url,
      latency: null,
      success: false,
      timestamp: new Date(),
      error: error.message,
    };
  }
}

/**
 * Calculate metrics for each URL
 */
function calculateMetricsPerURL(results, region) {
  // Group results by URL
  const byURL = {};
  results.forEach((r) => {
    if (!byURL[r.url]) byURL[r.url] = [];
    byURL[r.url].push(r);
  });

  // Calculate metrics for each URL
  return Object.entries(byURL).map(([url, urlResults]) => {
    const successful = urlResults.filter((r) => r.success);
    const latencies = successful.map((r) => r.latency).sort((a, b) => a - b);

    return {
      url,
      region,
      availability: (successful.length / urlResults.length) * 100,
      p99Latency: percentile(latencies, 0.99),
      p95Latency: percentile(latencies, 0.95),
      p50Latency: percentile(latencies, 0.50),
      avgResponseTime: average(latencies),
      totalRequests: urlResults.length,
      successfulRequests: successful.length,
      failedRequests: urlResults.length - successful.length,
    };
  });
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray, p) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil(sortedArray.length * p) - 1;
  return Math.round(sortedArray[Math.max(0, index)]);
}

/**
 * Calculate average
 */
function average(array) {
  if (array.length === 0) return 0;
  const sum = array.reduce((a, b) => a + b, 0);
  return Math.round(sum / array.length);
}

module.exports = {
  executeBenchmark,
  testURL,
  calculateMetricsPerURL,
  percentile,
  average,
};
