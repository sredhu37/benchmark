/**
 * Format latency in milliseconds
 */
export function formatLatency(ms) {
  if (ms === null || ms === undefined) return 'N/A';
  return `${Math.round(ms)}ms`;
}

/**
 * Format availability percentage
 */
export function formatAvailability(percentage) {
  if (percentage === null || percentage === undefined) return 'N/A';
  return `${percentage.toFixed(2)}%`;
}

/**
 * Get color based on availability
 */
export function getAvailabilityColor(availability) {
  if (availability >= 99.5) return 'success';
  if (availability >= 95) return 'warning';
  return 'error';
}

/**
 * Get color based on latency
 */
export function getLatencyColor(latency) {
  if (latency < 100) return 'success';
  if (latency < 300) return 'warning';
  return 'error';
}

/**
 * Export results as CSV
 */
export function exportToCSV(results) {
  const headers = ['Website', 'Region', 'Availability', 'P99 Latency', 'P95 Latency', 'P50 Latency', 'Avg Response Time', 'Total Requests', 'Successful', 'Failed'];

  const rows = results.map((r) => [
    r.url,
    r.region,
    r.availability.toFixed(2),
    r.p99Latency,
    r.p95Latency,
    r.p50Latency,
    r.avgResponseTime,
    r.totalRequests,
    r.successfulRequests,
    r.failedRequests,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `benchmark-results-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export results as JSON
 */
export function exportToJSON(results) {
  const jsonContent = JSON.stringify(results, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `benchmark-results-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
