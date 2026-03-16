/**
 * Google Calendar Service
 *
 * Handles OAuth 2.0 flow and CRUD operations for Google Calendar events.
 * Follows the singleton service pattern from stripeService.js.
 */

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Generate the Google OAuth consent URL
 * @param {string} state - Encrypted state parameter (userId + nonce)
 * @returns {string} Authorization URL
 */
export function getAuthUrl(state) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent', // Force consent to always get refresh_token
  });
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google callback
 * @returns {Promise<{access_token: string, refresh_token: string, expiry_date: number, email: string}>}
 */
export async function exchangeCodeForTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);

  // Get the user's email from the token
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    email: data.email,
  };
}

/**
 * Refresh an expired access token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<{access_token: string, expiry_date: number}>}
 */
export async function refreshAccessToken(refreshToken) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date,
  };
}

/**
 * Create an event on Google Calendar
 * @param {string} accessToken - Valid access token
 * @param {Object} eventData - Google Calendar event resource
 * @param {string} [calendarId='primary'] - Calendar ID
 * @returns {Promise<{id: string, htmlLink: string}>}
 */
export async function createEvent(accessToken, eventData, calendarId = 'primary') {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.events.insert({
    calendarId,
    resource: eventData,
  });
  console.log(`[GOOGLE_CALENDAR] Created event ${response.data.id}`);
  return { id: response.data.id, htmlLink: response.data.htmlLink };
}

/**
 * Update an existing event on Google Calendar
 * @param {string} accessToken - Valid access token
 * @param {string} externalEventId - Google Calendar event ID
 * @param {Object} eventData - Updated event resource
 * @param {string} [calendarId='primary'] - Calendar ID
 * @returns {Promise<{id: string}>}
 */
export async function updateEvent(accessToken, externalEventId, eventData, calendarId = 'primary') {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.events.patch({
    calendarId,
    eventId: externalEventId,
    resource: eventData,
  });
  console.log(`[GOOGLE_CALENDAR] Updated event ${externalEventId}`);
  return { id: response.data.id };
}

/**
 * Delete an event from Google Calendar
 * @param {string} accessToken - Valid access token
 * @param {string} externalEventId - Google Calendar event ID
 * @param {string} [calendarId='primary'] - Calendar ID
 */
export async function deleteEvent(accessToken, externalEventId, calendarId = 'primary') {
  const calendar = getCalendarClient(accessToken);
  try {
    await calendar.events.delete({
      calendarId,
      eventId: externalEventId,
    });
    console.log(`[GOOGLE_CALENDAR] Deleted event ${externalEventId}`);
  } catch (error) {
    // 404/410 = already deleted, which is fine
    if (error.code === 404 || error.code === 410) {
      console.log(`[GOOGLE_CALENDAR] Event ${externalEventId} already deleted`);
      return;
    }
    throw error;
  }
}

/**
 * Create an authenticated Google Calendar client
 * @param {string} accessToken - Valid access token
 * @returns {Object} Google Calendar API client
 */
function getCalendarClient(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}
