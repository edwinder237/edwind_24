import axios from 'axios';

const axiosServices = axios.create({
  timeout: 120000, // 2 minutes timeout for slower connections and large imports
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

// Helper to read a cookie by name
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// Request interceptor to add retry logic, CSRF token, and AbortController support
axiosServices.interceptors.request.use(
  (config) => {
    // Add retry configuration
    config.retryCount = config.retryCount || 0;
    config.maxRetries = 2; // Retry up to 2 times

    // Add request timestamp for debugging
    config.requestStartTime = Date.now();

    // Attach CSRF token for state-changing requests
    const method = (config.method || 'get').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = getCookie('__csrf');
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosServices.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;

    // Check if it's a timeout or network error and we haven't exceeded max retries
    if (
      config &&
      config.retryCount < config.maxRetries &&
      (error.code === 'ECONNABORTED' ||
       error.code === 'ETIMEDOUT' ||
       error.code === 'ENOTFOUND' ||
       error.code === 'ECONNRESET' ||
       !error.response ||
       (error.response?.status >= 500 && error.response?.status < 600))
    ) {
      config.retryCount += 1;

      // Exponential backoff: wait longer for each retry
      const delay = Math.pow(2, config.retryCount) * 1000; // 2s, 4s, 8s...
      await new Promise(resolve => setTimeout(resolve, delay));

      return axiosServices(config);
    }

    // Intercept resource limit / feature-not-available errors and show global dialog
    if (error.response?.status === 403 && error.response?.data) {
      const data = error.response.data;
      if (
        data.error === 'Resource limit exceeded' ||
        data.error === 'Feature not available' ||
        data.reason === 'plan_upgrade_required'
      ) {
        try {
          const { showResourceLimitError } = await import('contexts/ResourceLimitContext');
          showResourceLimitError(data);
        } catch (_) {
          // Context not mounted yet (e.g., during SSR) — fall through
        }
        data._limitHandled = true;
      }
    }

    return Promise.reject((error.response && error.response.data) || 'Network error occurred');
  }
);

export default axiosServices;
