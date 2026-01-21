/**
 * Microsoft Forms Provider Service
 *
 * Handles integration with Microsoft Forms for surveys.
 * Supports fetching responses via Microsoft Graph API if configured.
 */

const microsoftFormsService = {
  /**
   * Validate Microsoft Forms configuration
   */
  validateConfig(config) {
    const errors = {};

    if (!config.formUrl) {
      errors.formUrl = 'Form URL is required';
    } else {
      try {
        const url = new URL(config.formUrl);
        if (!url.hostname.includes('forms.office.com') && !url.hostname.includes('microsoft.com')) {
          errors.formUrl = 'Must be a valid Microsoft Forms URL';
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
    // Microsoft Graph API access requires Azure AD setup
    return false;
  },

  /**
   * Fetch responses from Microsoft Forms
   * Requires Microsoft Graph API access
   */
  async getResponses(config) {
    // TODO: Implement Microsoft Graph API integration
    // This would require:
    // 1. Azure AD app registration
    // 2. Microsoft Graph API calls
    //
    // For now, return a placeholder response
    return {
      success: false,
      responses: [],
      error: 'Microsoft Graph API integration not yet implemented. View responses directly in Microsoft Forms.'
    };
  },

  /**
   * Get response count
   */
  async getResponseCount(config) {
    const result = await this.getResponses(config);
    if (result.success) {
      return {
        success: true,
        count: result.responses.length
      };
    }
    return {
      success: false,
      count: 0,
      error: result.error
    };
  }
};

export default microsoftFormsService;
