/**
 * Generic Provider Service
 *
 * Fallback service for any survey URL that doesn't match specific providers.
 * Only provides URL access, no API integration.
 */

const genericService = {
  /**
   * Validate generic configuration
   */
  validateConfig(config) {
    const errors = {};

    if (!config.formUrl) {
      errors.formUrl = 'Survey URL is required';
    } else {
      try {
        new URL(config.formUrl);
      } catch {
        errors.formUrl = 'Must be a valid URL';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Get the form URL for participants
   */
  getFormUrl(config) {
    return config.formUrl;
  },

  /**
   * Check if API access is configured
   */
  supportsApiAccess() {
    return false;
  },

  /**
   * Fetch responses - not supported for generic provider
   */
  async getResponses(config) {
    return {
      success: false,
      responses: [],
      error: 'Response fetching not available for this provider. View responses directly in your survey tool.'
    };
  },

  /**
   * Get response count - not supported for generic provider
   */
  async getResponseCount(config) {
    return {
      success: false,
      count: 0,
      error: 'Response count not available for this provider.'
    };
  }
};

export default genericService;
