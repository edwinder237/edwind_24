/**
 * Credentials Email Template
 *
 * Template for sending tool access credentials to participants
 */

import { createHiddenUniqueContent } from '../helpers';

/**
 * Generate credentials email template
 *
 * @param {Object} params
 * @param {string} params.participantName - Recipient name
 * @param {Array} params.credentials - Array of credential objects
 * @param {string} params.projectName - Project name
 * @param {string} [params.organizationLogoUrl] - Organization logo URL
 * @returns {string} HTML email template
 */
export function generateCredentialsTemplate({ participantName, credentials, projectName, organizationLogoUrl }) {
  const credentialsHtml = credentials.map(credential => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px 8px; background-color: #f8f8f8;">
        <strong>${credential.tool}</strong>
        <br>
        <span style="color: #666666; font-size: 0.875rem;">${credential.toolType || 'Tool'}</span>
      </td>
      <td style="padding: 12px 8px;">
        <div style="margin-bottom: 4px;">
          <strong>Username:</strong> <code style="background-color: #f8f8f8; padding: 2px 6px; font-family: monospace;">${credential.username}</code>
        </div>
        <div style="margin-bottom: 4px;">
          <strong>Password:</strong> <code style="background-color: #f8f8f8; padding: 2px 6px; font-family: monospace;">${credential.accessCode}</code>
        </div>
        ${credential.toolUrl ? `
          <div style="margin-top: 8px;">
            <a href="${credential.toolUrl}" target="_blank" style="color: #333333; text-decoration: underline;">
              ${credential.toolUrl}
            </a>
          </div>
        ` : ''}
        ${credential.toolDescription ? `
          <div style="margin-top: 8px; color: #666666; font-size: 0.875rem;">
            ${credential.toolDescription}
          </div>
        ` : ''}
      </td>
    </tr>
  `).join('');

  const hiddenContent = createHiddenUniqueContent(`Credentials-${participantName}`);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Access Credentials</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">

      ${hiddenContent}

      <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px;">
        ${organizationLogoUrl ? `
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${organizationLogoUrl}" alt="Organization Logo" style="height: 50px; width: auto; max-width: 180px; object-fit: contain;">
          </div>
        ` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: normal; text-align: center;">Access Credentials</h1>
      </div>

      <div style="padding: 0 0 30px 0;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>

        <p style="color: #333333; margin-bottom: 25px;">
          Your access credentials for the CRM 360 tool have been prepared. Please find your login information below:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e0e0e0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 15px 8px; text-align: left; font-weight: normal; color: #000000; border-bottom: 2px solid #d0d0d0;">Tool</th>
              <th style="padding: 15px 8px; text-align: left; font-weight: normal; color: #000000; border-bottom: 2px solid #d0d0d0;">Credentials</th>
            </tr>
          </thead>
          <tbody>
            ${credentialsHtml}
          </tbody>
        </table>

        <div style="background-color: #f0f0f0; border: 1px solid #d0d0d0; padding: 16px; margin: 25px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Security Reminder</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #333333; font-size: 14px;">
            <li>Keep your credentials secure and do not share them with others</li>
            <li>Change your password after first login if the system allows it</li>
            <li>Contact support if you have any access issues</li>
          </ul>
        </div>

        <p style="color: #666666; margin-top: 25px; font-size: 14px;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
      </div>

      <div style="text-align: center; color: #999999; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <p style="margin: 0;">
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}
