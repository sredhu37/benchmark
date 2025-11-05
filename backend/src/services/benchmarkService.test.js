const {
  percentile,
  average,
  calculateMetricsPerURL,
} = require('./benchmarkService');

describe('Benchmark Service', () => {
  describe('percentile', () => {
    it('should calculate percentile correctly', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(percentile(sorted, 0.99)).toBe(10);
      expect(percentile(sorted, 0.50)).toBe(5);
    });

    it('should handle empty arrays', () => {
      expect(percentile([], 0.99)).toBe(0);
    });
  });

  describe('average', () => {
    it('should calculate average correctly', () => {
      expect(average([10, 20, 30])).toBe(20);
    });

    it('should handle empty arrays', () => {
      expect(average([])).toBe(0);
    });
  });

  describe('calculateMetricsPerURL', () => {
    it('should calculate metrics for multiple URLs', () => {
      const results = [
        { url: 'https://example.com', latency: 100, success: true },
        { url: 'https://example.com', latency: 150, success: true },
        { url: 'https://example.com', latency: 200, success: true },
        { url: 'https://competitor.com', latency: 300, success: true },
        { url: 'https://competitor.com', latency: 350, success: false },
      ];

      const metrics = calculateMetricsPerURL(results, 'us');

      expect(metrics).toHaveLength(2);
      expect(metrics[0].url).toBe('https://example.com');
      expect(metrics[0].availability).toBe(100);
      expect(metrics[0].totalRequests).toBe(3);
      
      expect(metrics[1].url).toBe('https://competitor.com');
      expect(metrics[1].availability).toBe(50);
      expect(metrics[1].totalRequests).toBe(2);
    });
  });
});
