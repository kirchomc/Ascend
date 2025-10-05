/**
 * Safe fetch with timeout and error handling
 * @param {string} url - URL to fetch
 * @param {RequestInit} opts - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds (default 8000)
 * @returns {Promise<any>} - JSON response
 */
export async function safeFetch(url, opts = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Safe fetch for entity operations with retry logic
 * @param {Function} operation - Async operation to perform
 * @param {number} retries - Number of retries (default 2)
 * @returns {Promise<any>}
 */
export async function safeFetchWithRetry(operation, retries = 2) {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}