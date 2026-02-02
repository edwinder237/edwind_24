/**
 * Email Validation Utilities
 *
 * Provides consistent email validation across all email operations
 */

/**
 * Basic email regex pattern for validation
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a single email address
 * @param {string} email - The email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Clean and normalize an email address
 * @param {string} email - The email address to clean
 * @returns {string|null} Cleaned email or null if invalid
 */
export function cleanEmail(email) {
  if (!isValidEmail(email)) return null;
  return email.trim().toLowerCase();
}

/**
 * Validate and filter a list of emails
 * @param {string[]} emails - Array of email addresses
 * @returns {{ valid: string[], invalid: string[] }} Object with valid and invalid emails
 */
export function validateEmailList(emails) {
  if (!Array.isArray(emails)) {
    return { valid: [], invalid: [] };
  }

  const valid = [];
  const invalid = [];

  for (const email of emails) {
    if (isValidEmail(email)) {
      valid.push(cleanEmail(email));
    } else {
      invalid.push(email || '(empty)');
    }
  }

  return { valid, invalid };
}

/**
 * Validate recipient data for sending emails
 * Returns validated recipients and a list of skipped ones
 *
 * @param {Array} recipients - Array of recipient objects with email property
 * @param {string} emailField - The field name containing the email (default: 'email')
 * @returns {{ valid: Array, invalid: Array }} Validated and invalid recipients
 */
export function validateRecipients(recipients, emailField = 'email') {
  if (!Array.isArray(recipients)) {
    return { valid: [], invalid: [] };
  }

  const valid = [];
  const invalid = [];

  for (const recipient of recipients) {
    const email = recipient?.[emailField];

    if (isValidEmail(email)) {
      valid.push({
        ...recipient,
        [emailField]: cleanEmail(email)
      });
    } else {
      invalid.push({
        ...recipient,
        reason: email ? 'Invalid email format' : 'Missing email'
      });
    }
  }

  return { valid, invalid };
}

/**
 * Validate contact form data
 * @param {Object} data - Contact form data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateContactForm(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!isValidEmail(data.email)) {
    errors.push('Invalid email address');
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  if (data.message && data.message.length > 2000) {
    errors.push('Message must be less than 2000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
