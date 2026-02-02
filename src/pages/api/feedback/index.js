/**
 * ============================================
 * FEEDBACK API
 * ============================================
 *
 * POST: Submits user feedback via email
 * Uses centralized email service
 */

import {
  isEmailServiceConfigured,
  checkRateLimit,
  sendFeedback
} from '../../../lib/email';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check email service configuration
  if (!isEmailServiceConfigured()) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Check authentication
  const userId = req.cookies.workos_user_id;
  if (!userId || userId === 'undefined') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Rate limiting
  if (checkRateLimit(req, res)) {
    return; // Response already sent by checkRateLimit
  }

  try {
    const { type, message, userName, userEmail, organizationName } = req.body;

    // Validate required fields
    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message are required' });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message must be less than 2000 characters' });
    }

    // Send feedback email using centralized service
    const result = await sendFeedback({
      type,
      message: message.trim(),
      userName: userName || 'Unknown User',
      userEmail: userEmail || 'unknown@unknown.com',
      organizationName: organizationName || 'N/A'
    });

    if (result.error) {
      console.error('Failed to send feedback email:', result.error);
      return res.status(500).json({ error: 'Failed to send feedback' });
    }

    console.log(`Feedback submitted: ${type} from ${userEmail}`);
    return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
