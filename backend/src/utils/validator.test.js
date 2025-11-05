const { isValidURL, validateURLs, sanitizeURL } = require('./validator');

describe('Validator Utilities', () => {
  describe('isValidURL', () => {
    it('should validate correct HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('ftp://example.com')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('validateURLs', () => {
    it('should accept valid URL arrays', () => {
      const result = validateURLs(['https://example.com']);
      expect(result.valid).toBe(true);
    });

    it('should reject non-arrays', () => {
      const result = validateURLs('not-an-array');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('array');
    });

    it('should reject empty arrays', () => {
      const result = validateURLs([]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject invalid URLs in array', () => {
      const result = validateURLs(['https://valid.com', 'invalid']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URLs');
    });
  });

  describe('sanitizeURL', () => {
    it('should normalize URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com/');
    });

    it('should return null for invalid URLs', () => {
      expect(sanitizeURL('not-a-url')).toBe(null);
    });
  });
});
