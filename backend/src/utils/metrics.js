/**
 * Calculate p99 latency
 */
function calculateP99(latencies) {
  if (!latencies || latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.99) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate p95 latency
 */
function calculateP95(latencies) {
  if (!latencies || latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate p50 (median) latency
 */
function calculateP50(latencies) {
  if (!latencies || latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.50) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate availability percentage
 */
function calculateAvailability(successful, total) {
  if (total === 0) return 0;
  return (successful / total) * 100;
}

/**
 * Calculate average response time
 */
function calculateAverage(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

module.exports = {
  calculateP99,
  calculateP95,
  calculateP50,
  calculateAvailability,
  calculateAverage,
};
