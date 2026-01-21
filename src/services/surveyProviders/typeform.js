/**
 * Typeform Provider Service
 *
 * Handles integration with Typeform for surveys.
 * Supports fetching responses via Typeform API if API key is provided.
 */

const typeformService = {
  /**
   * Validate Typeform configuration
   */
  validateConfig(config) {
    const errors = {};

    if (!config.formUrl) {
      errors.formUrl = 'Form URL is required';
    } else {
      try {
        const url = new URL(config.formUrl);
        if (!url.hostname.includes('typeform.com')) {
          errors.formUrl = 'Must be a valid Typeform URL';
        }
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
    return false; // Would return true if apiKey is provided and validated
  },

  /**
   * Extract form ID from Typeform URL
   */
  extractFormId(formUrl) {
    try {
      const url = new URL(formUrl);
      const pathParts = url.pathname.split('/');
      // Typeform URLs typically end with /to/{formId}
      const toIndex = pathParts.indexOf('to');
      if (toIndex !== -1 && pathParts[toIndex + 1]) {
        return pathParts[toIndex + 1];
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch responses from Typeform
   * Requires Typeform API key
   */
  async getResponses(config) {
    if (!config.apiKey) {
      return {
        success: false,
        responses: [],
        error: 'API Key required to fetch responses. Get your API key from Typeform settings.'
      };
    }

    const formId = this.extractFormId(config.formUrl);
    if (!formId) {
      return {
        success: false,
        responses: [],
        error: 'Could not extract form ID from URL'
      };
    }

    try {
      const response = await fetch(`https://api.typeform.com/forms/${formId}/responses`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Typeform API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        responses: data.items || [],
        totalCount: data.total_items || 0
      };
    } catch (error) {
      return {
        success: false,
        responses: [],
        error: error.message
      };
    }
  },

  /**
   * Get response count
   */
  async getResponseCount(config) {
    const result = await this.getResponses(config);
    if (result.success) {
      return {
        success: true,
        count: result.totalCount || result.responses.length
      };
    }
    return {
      success: false,
      count: 0,
      error: result.error
    };
  }
};

export default typeformService;
