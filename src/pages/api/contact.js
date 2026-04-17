import {
  isEmailServiceConfigured,
  checkRateLimit,
  validateContactForm,
  sendContactForm,
  isValidEmail
} from '../../lib/email';
import { createHandler } from '../../lib/api/createHandler';

const innerHandler = createHandler({
  scope: 'public',
  POST: async (req, res) => {
    if (!isEmailServiceConfigured()) {
      console.error('[contact] RESEND_API_KEY not configured');
      return res.status(500).json({
        error: 'Email service is not configured. Please try again later.'
      });
    }

    if (checkRateLimit(req, res)) {
      return;
    }

    const formData = req.body;

    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const sanitizedData = {
      name: formData.name?.trim() || '',
      email: formData.email?.trim().toLowerCase() || '',
      company: formData.company?.trim() || '',
      subject: formData.subject?.trim() || '',
      message: formData.message?.trim() || ''
    };

    const validation = validateContactForm(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    if (!isValidEmail(sanitizedData.email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }

    const result = await sendContactForm(sanitizedData);

    if (result.adminNotification?.error) {
      console.error('[contact] Failed to send admin notification:', result.adminNotification.error);
      return res.status(500).json({
        error: 'Failed to send message. Please try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully. We'll get back to you soon!",
      id: result.adminNotification?.data?.id
    });
  }
});

// Wrap with CORS headers for cross-origin contact form
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return innerHandler(req, res);
}
