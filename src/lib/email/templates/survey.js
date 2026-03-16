/**
 * Survey Email Template
 *
 * Template for sending satisfaction survey links to participants
 */

import { createHiddenUniqueContent } from '../helpers';

/**
 * Generate survey email template
 *
 * @param {Object} params
 * @param {string} params.participantName - Recipient name
 * @param {string} params.surveyUrl - Survey URL
 * @param {string} params.surveyTitle - Survey title
 * @param {string} params.projectName - Project name
 * @param {string} [params.organizationLogoUrl] - Organization logo URL
 * @returns {string} HTML email template
 */
export function generateSurveyTemplate({ participantName, surveyUrl, surveyTitle, projectName, organizationLogoUrl, instructorName }) {
  const hiddenContent = createHiddenUniqueContent(`Survey-${participantName}`);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Satisfaction Survey</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">

      ${hiddenContent}

      <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px;">
        ${organizationLogoUrl ? `
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${organizationLogoUrl}" alt="Organization Logo" style="height: 50px; width: auto; max-width: 180px; object-fit: contain;">
          </div>
        ` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: normal; text-align: center;">Satisfaction Survey</h1>
      </div>

      <div style="padding: 0 0 30px 0;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>

        <p style="color: #333333; margin-bottom: 25px;">
          We would love to hear your feedback about your training experience for <strong>${projectName}</strong>${instructorName ? ` led by <strong>${instructorName}</strong>` : ''}. Please take a few minutes to complete the following survey:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666666; margin-bottom: 15px; font-size: 14px;">
            <strong>${surveyTitle}</strong>
          </p>
          <a href="${surveyUrl}" target="_blank" style="display: inline-block; background-color: #1976d2; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500;">
            Complete Survey
          </a>
        </div>

        <p style="color: #666666; margin-top: 25px; font-size: 14px;">
          Your feedback is valuable and helps us improve our training programs. Thank you for your time.
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
