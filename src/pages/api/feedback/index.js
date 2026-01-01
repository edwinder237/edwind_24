/**
 * ============================================
 * FEEDBACK API
 * ============================================
 *
 * POST: Submits user feedback via email (Resend)
 * No database storage - just sends email to admin
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting (simple in-memory store)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const requests = rateLimit.get(ip).filter(timestamp => timestamp > windowStart);
  rateLimit.set(ip, [...requests, now]);

  return requests.length >= MAX_REQUESTS_PER_WINDOW;
};

// Email template for feedback
const createFeedbackEmail = (data) => ({
  from: process.env.RESEND_FROM_EMAIL || 'nelson.marc.perso@gmail.com',
  to: process.env.RESEND_TO_EMAIL || 'nelson.marc.perso@gmail.com',
  subject: `[Feedback] ${data.type}: From ${data.userName}`,
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #02174C, #1976d2);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
          }
          .type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            background: ${data.type === 'Bug Report' ? '#f44336' : data.type === 'Feature Request' ? '#4caf50' : '#ff9800'};
            color: white;
          }
          .field {
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #eee;
          }
          .label {
            font-weight: 600;
            color: #02174C;
            margin-bottom: 4px;
            display: block;
            font-size: 12px;
            text-transform: uppercase;
          }
          .value {
            color: #333;
          }
          .message-content {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 4px;
            border-left: 4px solid #1976d2;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">User Feedback</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">
              ${new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div class="field">
            <span class="label">Type</span>
            <div class="value"><span class="type-badge">${data.type}</span></div>
          </div>

          <div class="field">
            <span class="label">From</span>
            <div class="value">${data.userName} (<a href="mailto:${data.userEmail}">${data.userEmail}</a>)</div>
          </div>

          <div class="field">
            <span class="label">Organization</span>
            <div class="value">${data.organizationName || 'N/A'}</div>
          </div>

          <div class="field">
            <span class="label">Message</span>
            <div class="message-content">${data.message}</div>
          </div>
        </div>
      </body>
    </html>
  `
});

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check Resend configuration
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Check authentication
  const userId = req.cookies.workos_user_id;
  if (!userId || userId === 'undefined') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (isRateLimited(clientIP)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

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

    // Send email
    const emailResult = await resend.emails.send(createFeedbackEmail({
      type,
      message: message.trim(),
      userName: userName || 'Unknown User',
      userEmail: userEmail || 'unknown@unknown.com',
      organizationName: organizationName || 'N/A'
    }));

    if (emailResult.error) {
      console.error('Failed to send feedback email:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send feedback' });
    }

    console.log(`Feedback submitted: ${type} from ${userEmail}`);
    return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
