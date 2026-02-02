/**
 * Contact Form Email Templates
 *
 * Templates for contact form submissions (admin notification + user auto-reply)
 */

/**
 * High priority subjects that get a badge
 */
const HIGH_PRIORITY_SUBJECTS = ['Product Demo', 'Enterprise Solutions', 'Partnership'];

/**
 * Generate contact form admin notification email
 *
 * @param {Object} formData
 * @param {string} formData.name - Contact name
 * @param {string} formData.email - Contact email
 * @param {string} formData.subject - Subject/topic
 * @param {string} formData.message - Message content
 * @param {string} [formData.company] - Company name (optional)
 * @returns {string} HTML email template
 */
export function generateContactAdminTemplate(formData) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const isHighPriority = HIGH_PRIORITY_SUBJECTS.includes(formData.subject);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
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
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .field {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          .field:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #02174C;
            margin-bottom: 5px;
            display: block;
          }
          .value {
            color: #666;
            word-wrap: break-word;
          }
          .message-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #1976d2;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          .priority-badge {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Received on ${timestamp}</p>
          </div>

          <div class="field">
            <span class="label">Subject:</span>
            <div class="value">
              ${formData.subject}
              ${isHighPriority ? '<span class="priority-badge">High Priority</span>' : ''}
            </div>
          </div>

          <div class="field">
            <span class="label">Full Name:</span>
            <div class="value">${formData.name}</div>
          </div>

          <div class="field">
            <span class="label">Email Address:</span>
            <div class="value">
              <a href="mailto:${formData.email}" style="color: #1976d2; text-decoration: none;">
                ${formData.email}
              </a>
            </div>
          </div>

          ${formData.company ? `
          <div class="field">
            <span class="label">Company/Organization:</span>
            <div class="value">${formData.company}</div>
          </div>
          ` : ''}

          <div class="field">
            <span class="label">Message:</span>
            <div class="message-content">${formData.message}</div>
          </div>

          <div class="footer">
            <p>This email was sent from the EDWIND contact form.</p>
            <p>
              <strong>Reply directly to this email</strong> to respond to ${formData.name} at
              <a href="mailto:${formData.email}" style="color: #1976d2;">${formData.email}</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate contact form auto-reply email for user
 *
 * @param {Object} formData
 * @param {string} formData.name - Contact name
 * @param {string} formData.subject - Subject/topic
 * @returns {string} HTML email template
 */
export function generateContactAutoReplyTemplate(formData) {
  const firstName = formData.name.split(' ')[0];
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Thank you for contacting EDWIND</title>
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
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #02174C, #1976d2);
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin: 0 auto 20px;
          }
          .content {
            text-align: left;
          }
          .highlight {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
            margin: 20px 0;
          }
          .contact-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .contact-info h3 {
            margin-top: 0;
            color: #02174C;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">E</div>
            <h1 style="color: #02174C; margin: 0;">Thank You!</h1>
            <p style="color: #666; margin: 10px 0 0 0;">
              We've received your message and will respond soon.
            </p>
          </div>

          <div class="content">
            <p>Hi ${firstName},</p>

            <p>
              Thank you for reaching out to EDWIND! We've successfully received your message
              regarding "<strong>${formData.subject}</strong>" and truly appreciate your interest
              in our training management platform.
            </p>

            <div class="highlight">
              <strong>What happens next?</strong>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Our team will review your message within the next few hours</li>
                <li>You'll receive a personalized response within 24 hours during business days</li>
                <li>For urgent inquiries, we'll prioritize your request accordingly</li>
              </ul>
            </div>

            <p>
              In the meantime, feel free to explore our platform features or check out our
              resources to learn more about how EDWIND can transform your training programs.
            </p>

            <div class="contact-info">
              <h3>Need immediate assistance?</h3>
              <p><strong>Email:</strong> admin@edwind.ca</p>
            </div>

            <p>
              We're excited about the opportunity to help your organization achieve better
              learning outcomes with EDWIND.
            </p>

            <p>
              Best regards,<br>
              <strong>The EDWIND Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>
              This is an automated confirmation email. Please do not reply to this message.<br>
              If you need to reach us, please email admin@edwind.ca
            </p>
            <p>
              &copy; ${currentYear} EDWIND by Lumeve. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
