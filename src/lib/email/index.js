/**
 * EDWIND Email Service
 *
 * Centralized email service for all email operations.
 * Provides a unified API for sending various types of emails
 * with proper validation, rate limiting, and error handling.
 */

// Core utilities
export {
  getResendClient,
  isEmailServiceConfigured,
  DEFAULT_FROM_EMAIL,
  SUPPORT_EMAIL,
  EMAIL_SENDERS
} from './resendClient';

// Validation utilities
export {
  isValidEmail,
  cleanEmail,
  validateEmailList,
  validateRecipients,
  validateContactForm
} from './validators';

// Rate limiting
export {
  delay,
  sendWithRetry,
  sendBatch,
  isRateLimited,
  getClientIP,
  checkRateLimit,
  RATE_LIMIT_CONFIG
} from './rateLimiter';

// ICS calendar generation
export {
  generateSingleEventICS,
  generateMultiEventICS,
  createEventDescription,
  generateICSFilename,
  icsToBase64,
  createICSAttachment
} from './icsGenerator';

// Helper utilities
export {
  generateUniqueMessageId,
  createAntiCollapseHeaders,
  fetchOrganizationLogo,
  fetchOrganizationDetails,
  formatRecipientName,
  createHiddenUniqueContent,
  escapeHtml,
  nl2br
} from './helpers';

// Email templates
export * from './templates';

// ============================================
// High-level email sending functions
// ============================================

import { getResendClient, EMAIL_SENDERS } from './resendClient';
import { isValidEmail, cleanEmail, validateEmailList } from './validators';
import { sendWithRetry, sendBatch as sendBatchEmails, delay } from './rateLimiter';
import { generateSingleEventICS, createICSAttachment } from './icsGenerator';
import { createAntiCollapseHeaders, formatRecipientName } from './helpers';
import {
  generateEventInviteTemplate,
  generateCredentialsTemplate,
  generateModuleLinkTemplate,
  generateFeedbackTemplate,
  generateContactAdminTemplate,
  generateContactAutoReplyTemplate
} from './templates';

/**
 * Send a single email
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender email (defaults to admin@edwind.ca)
 * @param {Object} [options.headers] - Custom headers
 * @param {Array} [options.attachments] - Email attachments
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail(options) {
  const resend = getResendClient();

  const emailData = {
    from: options.from || EMAIL_SENDERS.default,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    ...(options.headers && { headers: options.headers }),
    ...(options.attachments && { attachments: options.attachments })
  };

  return sendWithRetry(emailData);
}

/**
 * Send calendar invite to a single recipient
 *
 * @param {Object} options
 * @param {Object} options.event - Event data
 * @param {Object} options.recipient - Recipient data (email, firstName, lastName)
 * @param {string} options.projectTitle - Project title
 * @param {string} [options.organizerName] - Organizer name
 * @param {string} [options.groupName] - Group name
 * @returns {Promise<Object>} Send result
 */
export async function sendCalendarInvite(options) {
  const { event, recipient, projectTitle, organizerName = 'EDWIND Training', groupName } = options;

  // Validate email
  if (!isValidEmail(recipient.email)) {
    return {
      success: false,
      error: {
        message: `Invalid email address for ${formatRecipientName(recipient.firstName, recipient.lastName)}`,
        code: 'INVALID_EMAIL'
      }
    };
  }

  const cleanedEmail = cleanEmail(recipient.email);
  const recipientName = formatRecipientName(recipient.firstName, recipient.lastName);

  // Generate ICS
  const icsContent = generateSingleEventICS(event, {
    email: cleanedEmail,
    firstName: recipient.firstName,
    lastName: recipient.lastName
  }, organizerName);

  // Generate email HTML
  const html = generateEventInviteTemplate({
    participantName: recipientName,
    event,
    projectTitle,
    groupName
  });

  // Send email
  const result = await sendEmail({
    to: cleanedEmail,
    subject: `Training Session: ${event.title} | ${projectTitle}`,
    html,
    from: EMAIL_SENDERS.training,
    attachments: [createICSAttachment(icsContent, event.title)]
  });

  if (result.error) {
    return {
      success: false,
      error: result.error,
      recipient: recipientName
    };
  }

  return {
    success: true,
    emailId: result.data?.id || result.id,
    recipient: recipientName,
    email: cleanedEmail
  };
}

/**
 * Send credentials email to a participant
 *
 * @param {Object} options
 * @param {Object} options.participant - Participant data
 * @param {Array} options.credentials - Array of credential objects
 * @param {string} options.projectName - Project name
 * @param {string} [options.organizationLogoUrl] - Organization logo URL
 * @returns {Promise<Object>} Send result
 */
export async function sendCredentials(options) {
  const { participant, credentials, projectName, organizationLogoUrl } = options;

  if (!isValidEmail(participant.email)) {
    return {
      success: false,
      error: { message: 'Invalid email address', code: 'INVALID_EMAIL' }
    };
  }

  const recipientName = formatRecipientName(participant.firstName, participant.lastName);
  const headers = createAntiCollapseHeaders('credentials', participant.id);

  const html = generateCredentialsTemplate({
    participantName: recipientName,
    credentials,
    projectName,
    organizationLogoUrl
  });

  const result = await sendEmail({
    to: cleanEmail(participant.email),
    subject: `Your CRM 360 Access Credentials - ${projectName} - ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    html,
    from: EMAIL_SENDERS.credentials,
    headers
  });

  if (result.error) {
    return {
      success: false,
      error: result.error,
      participant: recipientName
    };
  }

  return {
    success: true,
    emailId: result.data?.id || result.id,
    participant: recipientName
  };
}

/**
 * Send module link email to a participant
 *
 * @param {Object} options
 * @param {Object} options.participant - Participant data
 * @param {string} options.moduleTitle - Module title
 * @param {string} options.activityTitle - Activity title
 * @param {string} options.moduleUrl - Module URL
 * @param {string} options.projectName - Project name
 * @param {string} options.eventTitle - Event title
 * @param {string} [options.organizationLogoUrl] - Organization logo URL
 * @returns {Promise<Object>} Send result
 */
export async function sendModuleLink(options) {
  const {
    participant,
    moduleTitle,
    activityTitle,
    moduleUrl,
    projectName,
    eventTitle,
    organizationLogoUrl
  } = options;

  if (!isValidEmail(participant.email)) {
    return {
      success: false,
      error: { message: 'Invalid email address', code: 'INVALID_EMAIL' }
    };
  }

  const recipientName = formatRecipientName(participant.firstName, participant.lastName);
  const headers = createAntiCollapseHeaders('module', participant.id);

  const html = generateModuleLinkTemplate({
    participantName: recipientName,
    moduleTitle,
    activityTitle,
    moduleUrl,
    projectName,
    eventTitle,
    organizationLogoUrl
  });

  const result = await sendEmail({
    to: cleanEmail(participant.email),
    subject: `Module Content: ${moduleTitle} - ${projectName} - ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    html,
    from: EMAIL_SENDERS.training,
    headers
  });

  if (result.error) {
    return {
      success: false,
      error: result.error,
      participant: recipientName
    };
  }

  return {
    success: true,
    emailId: result.data?.id || result.id,
    participant: recipientName
  };
}

/**
 * Send feedback notification email
 *
 * @param {Object} feedbackData
 * @param {string} feedbackData.type - Feedback type
 * @param {string} feedbackData.message - Feedback message
 * @param {string} feedbackData.userName - User name
 * @param {string} feedbackData.userEmail - User email
 * @param {string} [feedbackData.organizationName] - Organization name
 * @returns {Promise<Object>} Send result
 */
export async function sendFeedback(feedbackData) {
  const html = generateFeedbackTemplate(feedbackData);

  const result = await sendEmail({
    to: process.env.RESEND_TO_EMAIL || 'admin@edwind.ca',
    subject: `[Feedback] ${feedbackData.type}: From ${feedbackData.userName}`,
    html,
    from: process.env.RESEND_FROM_EMAIL || EMAIL_SENDERS.default
  });

  return result;
}

/**
 * Send contact form emails (admin notification + auto-reply)
 *
 * @param {Object} formData
 * @param {string} formData.name - Contact name
 * @param {string} formData.email - Contact email
 * @param {string} formData.subject - Subject
 * @param {string} formData.message - Message
 * @param {string} [formData.company] - Company name
 * @returns {Promise<Object>} Send results
 */
export async function sendContactForm(formData) {
  const results = {
    adminNotification: null,
    autoReply: null,
    success: false
  };

  // Send admin notification
  const adminHtml = generateContactAdminTemplate(formData);
  results.adminNotification = await sendEmail({
    to: process.env.RESEND_TO_EMAIL || 'admin@edwind.ca',
    subject: `EDWIND Contact Form: ${formData.subject}`,
    html: adminHtml,
    from: process.env.RESEND_FROM_EMAIL || EMAIL_SENDERS.default
  });

  // Send auto-reply to user
  const autoReplyHtml = generateContactAutoReplyTemplate(formData);
  results.autoReply = await sendEmail({
    to: formData.email,
    subject: "Thank you for contacting EDWIND - We'll be in touch soon!",
    html: autoReplyHtml,
    from: process.env.RESEND_FROM_EMAIL || EMAIL_SENDERS.default
  });

  results.success = !results.adminNotification.error && !results.autoReply.error;

  return results;
}

/**
 * Email service object for convenient access
 */
export const emailService = {
  // Core send functions
  send: sendEmail,
  sendBatch: sendBatchEmails,

  // Specific email types
  sendCalendarInvite,
  sendCredentials,
  sendModuleLink,
  sendFeedback,
  sendContactForm,

  // Utilities
  isValidEmail,
  cleanEmail,
  validateEmailList,
  generateICS: generateSingleEventICS,
  createICSAttachment
};

export default emailService;
