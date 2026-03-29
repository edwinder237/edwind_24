/**
 * Email Logger Utility
 *
 * Fire-and-forget async logging to track individual sent emails.
 * Uses setImmediate to defer database writes and avoid blocking API responses.
 * Mirrors the pattern in src/lib/usage/usageLogger.js.
 */

import prisma from '../prisma';

/**
 * Log a single email send (fire-and-forget).
 *
 * @param {Object} params
 * @param {number} params.sub_organizationId
 * @param {string} params.recipientEmail
 * @param {string} [params.recipientName]
 * @param {string} [params.recipientType] - "participant", "instructor", "contact", "admin"
 * @param {string} params.subject
 * @param {string} params.emailType - "credentials", "event_access", "module_link", "survey", "calendar_invite"
 * @param {string} params.status - "sent", "failed", "skipped"
 * @param {string} [params.errorMessage]
 * @param {string} [params.resendEmailId]
 * @param {number} [params.projectId]
 * @param {string} [params.projectTitle]
 * @param {number} [params.eventId]
 * @param {string} [params.participantId]
 * @param {string} [params.sentByUserId]
 * @param {string} [params.sentByUserName]
 */
export function logEmail(params) {
  if (!params.sub_organizationId || !params.recipientEmail) return;

  setImmediate(async () => {
    try {
      await prisma.email_logs.create({ data: params });
    } catch (error) {
      console.error('[EmailLogger] Failed to log email:', error.message);
    }
  });
}

/**
 * Log multiple emails in a single batch (fire-and-forget).
 * More efficient than individual logEmail calls for batch sends.
 *
 * @param {Array<Object>} records - Array of email log params (same shape as logEmail)
 */
export function logEmailBatch(records) {
  const valid = records.filter(r => r.sub_organizationId && r.recipientEmail);
  if (valid.length === 0) return;

  setImmediate(async () => {
    try {
      await prisma.email_logs.createMany({ data: valid });
    } catch (error) {
      console.error('[EmailLogger] Failed to log email batch:', error.message);
    }
  });
}
