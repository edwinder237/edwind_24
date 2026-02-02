/**
 * Singleton Resend Email Client
 *
 * Provides a single shared instance of the Resend client
 * to avoid creating multiple instances across the application.
 */

import { Resend } from 'resend';

let resendInstance = null;

/**
 * Get the singleton Resend client instance
 * @returns {Resend} The Resend client instance
 * @throws {Error} If RESEND_API_KEY is not configured
 */
export function getResendClient() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }

    resendInstance = new Resend(apiKey);
  }

  return resendInstance;
}

/**
 * Check if the email service is properly configured
 * @returns {boolean} True if configured, false otherwise
 */
export function isEmailServiceConfigured() {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Default sender configuration
 */
export const DEFAULT_FROM_EMAIL = 'EDWIND <admin@edwind.ca>';
export const SUPPORT_EMAIL = 'support@edwind.ca';

/**
 * Email sender presets for different types of emails
 */
export const EMAIL_SENDERS = {
  training: 'Training Schedule <admin@edwind.ca>',
  credentials: 'CRM 360 access credentials <admin@edwind.ca>',
  notifications: 'EDWIND Notifications <admin@edwind.ca>',
  default: DEFAULT_FROM_EMAIL
};
