/**
 * Survey Provider Service Factory
 *
 * This module provides a factory pattern for accessing different survey provider integrations.
 * Each provider implements a common interface for fetching survey data.
 *
 * Currently supported providers:
 * - google_forms: Google Forms integration
 * - microsoft_forms: Microsoft Forms integration
 * - typeform: Typeform integration
 * - surveymonkey: SurveyMonkey integration
 * - other: Generic fallback for any URL
 */

import googleFormsService from './googleForms';
import microsoftFormsService from './microsoftForms';
import typeformService from './typeform';
import surveymonkeyService from './surveymonkey';
import genericService from './generic';

/**
 * Get the appropriate provider service based on provider key
 * @param {string} provider - The provider key (google_forms, microsoft_forms, etc.)
 * @returns {Object} Provider service with standard interface
 */
export const getProviderService = (provider) => {
  switch (provider) {
    case 'google_forms':
      return googleFormsService;
    case 'microsoft_forms':
      return microsoftFormsService;
    case 'typeform':
      return typeformService;
    case 'surveymonkey':
      return surveymonkeyService;
    case 'other':
    default:
      return genericService;
  }
};

/**
 * Provider service interface that all providers should implement:
 *
 * - validateConfig(config): Validate provider-specific configuration
 *   Returns: { isValid: boolean, errors: object }
 *
 * - getFormUrl(config): Get the URL for participants to access the form
 *   Returns: string (URL)
 *
 * - getResponses(config): Fetch responses from the provider API
 *   Returns: { success: boolean, responses: array, error?: string }
 *
 * - getResponseCount(config): Get just the count of responses
 *   Returns: { success: boolean, count: number, error?: string }
 *
 * - supportsApiAccess(): Whether this provider supports API-based response fetching
 *   Returns: boolean
 */

export default {
  getProviderService
};
