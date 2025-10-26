export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Request timed out. Please check your connection and try again.';
  }
  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNRESET') {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (error?.response?.status === 500) {
    return 'Server error. Please try again in a few moments.';
  }
  if (error?.response?.status === 404) {
    return 'Requested resource not found.';
  }
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return error?.response?.data?.message || 'Request failed. Please try again.';
  }
  
  return error?.response?.data?.message || error?.message || defaultMessage;
};