/**
 * Validate URL format
 */
function isValidURL(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Validate array of URLs
 */
function validateURLs(urls) {
  if (!Array.isArray(urls)) {
    return { valid: false, error: 'URLs must be an array' };
  }

  if (urls.length === 0) {
    return { valid: false, error: 'At least one URL is required' };
  }

  const maxUrls = parseInt(process.env.MAX_URLS || '5', 10);
  if (urls.length > maxUrls) {
    return { valid: false, error: `Maximum ${maxUrls} URLs allowed` };
  }

  const invalidUrls = urls.filter((url) => !isValidURL(url));
  if (invalidUrls.length > 0) {
    return {
      valid: false,
      error: `Invalid URLs: ${invalidUrls.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize URL (basic sanitization)
 */
function sanitizeURL(urlString) {
  try {
    const url = new URL(urlString);
    // Return normalized URL
    return url.toString();
  } catch (error) {
    return null;
  }
}

module.exports = {
  isValidURL,
  validateURLs,
  sanitizeURL,
};
