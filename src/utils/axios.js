import axios from 'axios';

const axiosServices = axios.create({
  timeout: 120000, // 2 minutes timeout for slower connections and large imports
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

// Request interceptor to add retry logic and AbortController support
axiosServices.interceptors.request.use(
  (config) => {
    // Add retry configuration
    config.retryCount = config.retryCount || 0;
    config.maxRetries = 2; // Retry up to 2 times

    // Add request timestamp for debugging
    config.requestStartTime = Date.now();

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

    return Promise.reject((error.response && error.response.data) || 'Network error occurred');
  }
);

export default axiosServices;
