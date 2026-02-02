/**
 * Feedback Email Template
 *
 * Template for internal feedback notifications
 */

/**
 * Get badge color based on feedback type
 * @param {string} type - Feedback type
 * @returns {string} CSS color
 */
function getTypeBadgeColor(type) {
  const colors = {
    'Bug Report': '#f44336',
    'Feature Request': '#4caf50',
    'General Feedback': '#ff9800',
    'Question': '#2196f3',
    'Other': '#9e9e9e'
  };
  return colors[type] || colors['Other'];
}

/**
 * Generate feedback notification email template
 *
 * @param {Object} params
 * @param {string} params.type - Feedback type (Bug Report, Feature Request, etc.)
 * @param {string} params.message - Feedback message content
 * @param {string} params.userName - User name who submitted feedback
 * @param {string} params.userEmail - User email
 * @param {string} [params.organizationName] - Organization name
 * @returns {string} HTML email template
 */
export function generateFeedbackTemplate({ type, message, userName, userEmail, organizationName }) {
  const badgeColor = getTypeBadgeColor(type);
  const timestamp = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
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
            background: ${badgeColor};
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
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${timestamp}</p>
          </div>

          <div class="field">
            <span class="label">Type</span>
            <div class="value"><span class="type-badge">${type}</span></div>
          </div>

          <div class="field">
            <span class="label">From</span>
            <div class="value">${userName} (<a href="mailto:${userEmail}">${userEmail}</a>)</div>
          </div>

          <div class="field">
            <span class="label">Organization</span>
            <div class="value">${organizationName || 'N/A'}</div>
          </div>

          <div class="field">
            <span class="label">Message</span>
            <div class="message-content">${message}</div>
          </div>
        </div>
      </body>
    </html>
  `;
}
