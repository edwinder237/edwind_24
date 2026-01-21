// Survey provider configurations and constants

export const SURVEY_PROVIDERS = {
  google_forms: {
    key: 'google_forms',
    label: 'Google Forms',
    description: 'Link to Google Forms survey',
    supportsResults: true,
    configFields: [
      { key: 'formUrl', label: 'Form URL', type: 'url', required: true, placeholder: 'https://docs.google.com/forms/d/e/.../viewform' }
    ],
    resultsInfo: 'Results fetched via Google Forms API. Requires service account setup.'
  },
  microsoft_forms: {
    key: 'microsoft_forms',
    label: 'Microsoft Forms',
    description: 'Link to Microsoft Forms survey',
    supportsResults: false,
    configFields: [
      { key: 'formUrl', label: 'Form URL', type: 'url', required: true, placeholder: 'https://forms.office.com/r/...' }
    ]
  },
  typeform: {
    key: 'typeform',
    label: 'Typeform',
    description: 'Link to Typeform survey',
    supportsResults: true,
    configFields: [
      { key: 'formUrl', label: 'Typeform URL', type: 'url', required: true, placeholder: 'https://xxx.typeform.com/to/...' },
      { key: 'apiKey', label: 'API Key', type: 'password', required: false, helperText: 'Required to fetch responses' }
    ],
    resultsInfo: 'Provide API key to fetch results directly.'
  },
  surveymonkey: {
    key: 'surveymonkey',
    label: 'SurveyMonkey',
    description: 'Link to SurveyMonkey survey',
    supportsResults: false,
    configFields: [
      { key: 'formUrl', label: 'Survey URL', type: 'url', required: true, placeholder: 'https://www.surveymonkey.com/r/...' },
      { key: 'apiKey', label: 'API Key', type: 'password', required: false, helperText: 'Required to fetch responses' }
    ]
  },
  other: {
    key: 'other',
    label: 'Other',
    description: 'Link to any other survey tool',
    supportsResults: false,
    configFields: [
      { key: 'formUrl', label: 'Survey URL', type: 'url', required: true, placeholder: 'https://...' },
      { key: 'notes', label: 'Notes', type: 'text', required: false, helperText: 'Any additional notes about this survey' }
    ]
  }
};

export const SURVEY_TYPES = {
  pre_training: {
    key: 'pre_training',
    label: 'Pre-Training',
    description: 'Sent before training begins'
  },
  post_training: {
    key: 'post_training',
    label: 'Post-Training',
    description: 'Sent after training completes'
  },
  per_course: {
    key: 'per_course',
    label: 'Per-Course',
    description: 'Sent after specific course completion',
    requiresCourse: true
  },
  custom: {
    key: 'custom',
    label: 'Custom Timing',
    description: 'Sent X days after enrollment',
    requiresDays: true
  }
};

export const SURVEY_STATUSES = {
  draft: { key: 'draft', label: 'Draft', color: 'default' },
  active: { key: 'active', label: 'Active', color: 'success' },
  archived: { key: 'archived', label: 'Archived', color: 'warning' }
};

// Helper functions
export const getProviderLabel = (providerKey) => {
  return SURVEY_PROVIDERS[providerKey]?.label || providerKey;
};

export const getSurveyTypeLabel = (typeKey) => {
  return SURVEY_TYPES[typeKey]?.label || typeKey;
};

export const getStatusColor = (statusKey) => {
  return SURVEY_STATUSES[statusKey]?.color || 'default';
};

export const getProviderConfigFields = (providerKey) => {
  return SURVEY_PROVIDERS[providerKey]?.configFields || [];
};

export const validateProviderConfig = (providerKey, config) => {
  const fields = getProviderConfigFields(providerKey);
  const errors = {};

  fields.forEach(field => {
    if (field.required && !config[field.key]) {
      errors[field.key] = `${field.label} is required`;
    }
    if (field.type === 'url' && config[field.key]) {
      try {
        new URL(config[field.key]);
      } catch {
        errors[field.key] = `${field.label} must be a valid URL`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
