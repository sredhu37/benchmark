import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Start a new benchmark
 */
export async function startBenchmark(urls, duration = 30) {
  const response = await axios.post(`${API_URL}/benchmark`, {
    urls,
    duration,
    regions: ['asia', 'europe', 'us'],
  });
  return response.data;
}

/**
 * Get benchmark results
 */
export async function getBenchmarkResults(jobId) {
  const response = await axios.get(`${API_URL}/benchmark/${jobId}`);
  return response.data;
}

/**
 * Poll for results until completed
 */
export async function pollForResults(jobId, maxAttempts = 60, interval = 2000) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const data = await getBenchmarkResults(jobId);

    if (data.status === 'completed') {
      return data;
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Benchmark failed');
    }

    // Wait before next poll
    await new Promise((resolve) => { setTimeout(resolve, interval); });
    attempts += 1;
  }

  throw new Error('Timeout waiting for results');
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await axios.get(`${API_URL}/health`);
  return response.data;
}
