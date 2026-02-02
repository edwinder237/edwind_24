/**
 * Event Invite Email Templates
 *
 * Templates for calendar event invitation emails
 */

import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';

/**
 * Generate single event invitation email template
 *
 * @param {Object} params
 * @param {string} params.participantName - Recipient name
 * @param {Object} params.event - Event data
 * @param {string} params.projectTitle - Project/training title
 * @param {string} [params.groupName] - Group name (optional)
 * @returns {string} HTML email template
 */
export function generateEventInviteTemplate({ participantName, event, projectTitle, groupName }) {
  const eventTimezone = event.timezone || 'UTC';

  // Format date and time in the event's timezone
  const startTime = eventTimezone !== 'UTC'
    ? formatInTimeZone(event.startTime, eventTimezone, 'EEEE, MMMM d, yyyy', { locale: enUS })
    : format(event.startTime, 'EEEE, MMMM d, yyyy', { locale: enUS });

  const timeRange = eventTimezone !== 'UTC'
    ? `${formatInTimeZone(event.startTime, eventTimezone, 'HH:mm')} - ${formatInTimeZone(event.endTime, eventTimezone, 'HH:mm')}`
    : `${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Session - ${event.title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e1e5e9; margin-bottom: 20px;">
        <p style="font-size: 18px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>

        <p style="color: #6c757d; margin-bottom: 25px;">
          You are invited to attend the following training session${groupName ? ` as part of the <strong>${groupName}</strong> group` : ''}:
        </p>

        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #1976d2;">
          <h2 style="margin: 0 0 15px 0; color: #1976d2; font-size: 24px;">${event.title}</h2>
          ${event.course && event.course !== event.title ? `<p style="margin: 0 0 10px 0; color: #6c757d; font-weight: 500;">Course: ${event.course}</p>` : ''}

          <div style="margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${startTime}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timeRange}</p>
            <p style="margin: 5px 0;"><strong>Time Zone:</strong> ${eventTimezone}</p>
            ${event.room ? `<p style="margin: 5px 0;"><strong>Room:</strong> ${event.room.name}${event.room.location ? ` (${event.room.location})` : ''}</p>` : ''}
            ${event.location && !event.room ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.meetingLink ? `
              <p style="margin: 5px 0;"><strong>Join Meeting:</strong>
                <a href="${event.meetingLink}" target="_blank" style="color: #1976d2; text-decoration: none; font-weight: 500;">
                  Click to Join
                </a>
              </p>
            ` : ''}
          </div>

          ${event.description ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d;">${event.description.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
        </div>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #155724; font-size: 16px;">Calendar Invitation Attached</h3>
          <p style="margin: 8px 0; color: #155724;">
            A calendar invitation (.ics file) is attached to this email. Click on it to add this event to your calendar and respond with Accept/Decline.
          </p>
        </div>

      </div>

      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e1e5e9; padding-top: 20px;">
        <p style="margin: 0;">
          EDWIND Training Management System<br>
          <a href="mailto:support@edwind.ca" style="color: #1976d2;">support@edwind.ca</a>
        </p>
      </div>

    </body>
    </html>
  `;
}

/**
 * Generate training schedule summary email with multiple events
 *
 * @param {Object} params
 * @param {string} params.participantName - Recipient name
 * @param {string} params.projectTitle - Project/training title
 * @param {Array} params.events - Array of event objects
 * @param {string} [params.groupName] - Group name (optional)
 * @returns {string} HTML email template
 */
export function generateScheduleSummaryTemplate({ participantName, projectTitle, events, groupName }) {
  const eventsHtml = events.map(event => {
    const startTime = format(event.startTime, 'EEEE, MMMM d, yyyy', { locale: enUS });
    const timeRange = `${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`;

    return `
      <tr style="border-bottom: 1px solid #e1e5e9;">
        <td style="padding: 12px 8px; background-color: #f8f9fa;">
          <strong>${event.title}</strong>
          ${event.course ? `<br><span style="color: #6c757d; font-size: 0.875rem;">${event.course}</span>` : ''}
        </td>
        <td style="padding: 12px 8px;">
          <div style="margin-bottom: 4px;">
            <strong>Date:</strong> ${startTime}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Time:</strong> ${timeRange}
          </div>
          ${event.location ? `
            <div style="margin-bottom: 4px;">
              <strong>Location:</strong> ${event.location}
            </div>
          ` : ''}
          ${event.description ? `
            <div style="margin-top: 8px; color: #6c757d; font-size: 0.875rem;">
              ${event.description.replace(/\n/g, '<br>')}
            </div>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Schedule</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Training Schedule</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${projectTitle}</p>
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e1e5e9; margin-bottom: 20px;">
        <p style="font-size: 18px; margin-bottom: 20px;">
          Hello <strong>${participantName}</strong>,
        </p>

        <p style="color: #6c757d; margin-bottom: 25px;">
          You have been invited to participate in the <strong>${projectTitle}</strong> training program${groupName ? ` as part of the <strong>${groupName}</strong> group` : ''}. Please find your training schedule below:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Event</th>
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Schedule Details</th>
            </tr>
          </thead>
          <tbody>
            ${eventsHtml}
          </tbody>
        </table>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #155724; font-size: 16px;">Calendar File Attached</h3>
          <p style="margin: 8px 0; color: #155724;">
            A calendar file (.ics) is attached to this email. You can import it directly into your calendar application (Outlook, Google Calendar, Apple Calendar, etc.) to add all training events at once.
          </p>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0c5460; font-size: 16px;">Important Notes</h3>
          <ul style="margin: 8px 0; padding-left: 20px; color: #0c5460;">
            <li>Please arrive 15 minutes before each session</li>
            <li>Bring any required materials as specified in your course documentation</li>
            <li>Contact your instructor if you need to reschedule or have questions</li>
            <li>All training sessions are mandatory unless otherwise noted</li>
          </ul>
        </div>

        <p style="color: #6c757d; margin-top: 25px;">
          If you have any questions about your training schedule, please contact your training coordinator.
        </p>
      </div>

      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e1e5e9; padding-top: 20px;">
        <p style="margin: 0;">
          EDWIND Training Management System<br>
          <a href="mailto:support@edwind.ca" style="color: #1976d2;">support@edwind.ca</a>
        </p>
      </div>

    </body>
    </html>
  `;
}
