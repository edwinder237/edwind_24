/**
 * ============================================
 * CONTACT FORM API
 * ============================================
 *
 * POST: Processes contact form submissions
 * - Sends admin notification email
 * - Sends auto-reply to user
 * Uses centralized email service
 */

import {
  isEmailServiceConfigured,
  checkRateLimit,
  validateContactForm,
  sendContactForm,
  isValidEmail
} from '../../lib/email';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Please use POST.'
    });
  }

  // Check if email service is configured
  if (!isEmailServiceConfigured()) {
    console.error('[contact] RESEND_API_KEY not configured');
    return res.status(500).json({
      error: 'Email service is not configured. Please try again later.'
    });
  }

  // Rate limiting
  if (checkRateLimit(req, res)) {
    return; // Response already sent
  }

  try {
    // Validate request body
    const formData = req.body;

    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Sanitize input data
    const sanitizedData = {
      name: formData.name?.trim() || '',
      email: formData.email?.trim().toLowerCase() || '',
      company: formData.company?.trim() || '',
      subject: formData.subject?.trim() || '',
      message: formData.message?.trim() || ''
    };

    // Validate form data
    const validation = validateContactForm(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Additional email validation
    if (!isValidEmail(sanitizedData.email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }

    // Send contact form emails (admin notification + auto-reply)
    const result = await sendContactForm(sanitizedData);

    if (result.adminNotification?.error) {
      console.error('[contact] Failed to send admin notification:', result.adminNotification.error);
      return res.status(500).json({
        error: 'Failed to send message. Please try again later.'
      });
    }

    if (result.autoReply?.error) {
      // Non-critical - admin notification was sent
      console.warn('[contact] Failed to send auto-reply:', result.autoReply.error);
    }

    console.log(`[contact] Form submitted from ${sanitizedData.email} - Subject: ${sanitizedData.subject}`);

    return res.status(200).json({
      success: true,
      message: "Message sent successfully. We'll get back to you soon!",
      id: result.adminNotification?.data?.id
    });

  } catch (error) {
    console.error('[contact] Error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
}
