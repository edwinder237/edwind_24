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
 * Email address configuration — reads from .env, falls back to defaults
 */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'admin@email.edbahn.app';
export const ADMIN_EMAIL = FROM_EMAIL;
export const DEFAULT_FROM_EMAIL = `EDBAHN <${FROM_EMAIL}>`;
export const SUPPORT_EMAIL = process.env.RESEND_SUPPORT_EMAIL || 'support@email.edbahn.app';
export const SECURITY_EMAIL = process.env.RESEND_SECURITY_EMAIL || 'security@email.edbahn.app';

/**
 * Email sender presets for different types of emails
 */
export const EMAIL_SENDERS = {
  training: `Training Schedule <${FROM_EMAIL}>`,
  credentials: `CRM 360 access credentials <${FROM_EMAIL}>`,
  notifications: `EDBAHN Notifications <${FROM_EMAIL}>`,
  default: DEFAULT_FROM_EMAIL
};
