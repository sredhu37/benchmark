const {
  calculateP99,
  calculateP95,
  calculateP50,
  calculateAvailability,
  calculateAverage,
} = require('./metrics');

describe('Metrics Utilities', () => {
  describe('calculateP99', () => {
    it('should calculate 99th percentile correctly', () => {
      const latencies = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(calculateP99(latencies)).toBe(99);
    });

    it('should return 0 for empty array', () => {
      expect(calculateP99([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(calculateP99([100])).toBe(100);
    });
  });

  describe('calculateP95', () => {
    it('should calculate 95th percentile correctly', () => {
      const latencies = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(calculateP95(latencies)).toBe(95);
    });
  });

  describe('calculateP50', () => {
    it('should calculate median correctly', () => {
      const latencies = [1, 2, 3, 4, 5];
      expect(calculateP50(latencies)).toBe(3);
    });
  });

  describe('calculateAvailability', () => {
    it('should calculate availability percentage', () => {
      expect(calculateAvailability(95, 100)).toBe(95);
      expect(calculateAvailability(100, 100)).toBe(100);
      expect(calculateAvailability(0, 100)).toBe(0);
    });

    it('should return 0 for zero total', () => {
      expect(calculateAvailability(0, 0)).toBe(0);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average correctly', () => {
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateAverage([10, 20, 30])).toBe(20);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });
  });
});
