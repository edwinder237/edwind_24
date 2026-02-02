/**
 * Module Link Email Template
 *
 * Template for sending module/course content access links to participants
 */

import { createHiddenUniqueContent } from '../helpers';

/**
 * Generate module link email template
 *
 * @param {Object} params
 * @param {string} params.participantName - Recipient name
 * @param {string} params.moduleTitle - Module title
 * @param {string} params.activityTitle - Activity title
 * @param {string} params.moduleUrl - URL to access the module
 * @param {string} params.projectName - Project name
 * @param {string} params.eventTitle - Event title
 * @param {string} [params.organizationLogoUrl] - Organization logo URL
 * @returns {string} HTML email template
 */
export function generateModuleLinkTemplate({
  participantName,
  moduleTitle,
  activityTitle,
  moduleUrl,
  projectName,
  eventTitle,
  organizationLogoUrl
}) {
  const hiddenContent = createHiddenUniqueContent(`Module-${participantName}-${moduleTitle}`);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Module Content Link</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">

      ${hiddenContent}

      <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px;">
        ${organizationLogoUrl ? `
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${organizationLogoUrl}" alt="Organization Logo" style="height: 50px; width: auto; max-width: 180px; object-fit: contain;">
          </div>
        ` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: normal; text-align: center;">Module Content</h1>
      </div>

      <div style="padding: 0 0 30px 0;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>

        <p style="color: #333333; margin-bottom: 25px;">
          Your instructor has shared module content with you for the following session:
        </p>

        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 3px solid #666666;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">${eventTitle}</p>
          <p style="margin: 8px 0; color: #333333;">
            <strong>Module:</strong> ${moduleTitle}
          </p>
          <p style="margin: 8px 0; color: #333333;">
            <strong>Activity:</strong> ${activityTitle}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${moduleUrl}" target="_blank" style="display: inline-block; background: #4a4a4a; color: white; text-decoration: none; padding: 12px 30px; font-weight: normal; font-size: 16px;">
            Access Module Content
          </a>
        </div>

        <div style="background-color: #f0f0f0; border: 1px solid #d0d0d0; padding: 16px; margin: 25px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Important Notes</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #333333; font-size: 14px;">
            <li>This link will open the content in a new browser tab</li>
            <li>Make sure you have a stable internet connection</li>
            <li>Contact your instructor if you have trouble accessing the content</li>
          </ul>
        </div>

        <p style="color: #666666; margin-top: 25px; font-size: 14px;">
          If the button above doesn't work, you can copy and paste this link into your browser:
        </p>
        <div style="background: #f8f8f8; padding: 12px; word-break: break-all; font-family: monospace; font-size: 13px; border: 1px solid #e0e0e0;">
          ${moduleUrl}
        </div>
      </div>

      <div style="text-align: center; color: #999999; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <p style="margin: 0;">
          This is an automated message from EDWIND Training System.
          <br>
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}
