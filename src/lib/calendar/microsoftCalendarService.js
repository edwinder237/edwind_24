/**
 * Microsoft Calendar Service
 *
 * Handles OAuth 2.0 flow and CRUD operations for Microsoft Outlook Calendar events.
 * Uses MSAL Node for auth and Microsoft Graph Client for API calls.
 */

import * as msal from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

const TENANT_ID = process.env.MICROSOFT_CALENDAR_TENANT_ID || 'common';
const CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET;
const REDIRECT_URI = process.env.MICROSOFT_CALENDAR_REDIRECT_URI;

const SCOPES = ['Calendars.ReadWrite', 'User.Read', 'offline_access'];

/**
 * Get the MSAL confidential client application
 * @returns {msal.ConfidentialClientApplication}
 */
function getMsalClient() {
  return new msal.ConfidentialClientApplication({
    auth: {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    },
  });
}

/**
 * Generate the Microsoft OAuth consent URL
 * @param {string} state - Encrypted state parameter (userId + nonce)
 * @returns {Promise<string>} Authorization URL
 */
export async function getAuthUrl(state) {
  const msalClient = getMsalClient();
  const authUrl = await msalClient.getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
    state,
    prompt: 'consent',
  });
  return authUrl;
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Microsoft callback
 * @returns {Promise<{access_token: string, refresh_token: string, expiry_date: number, email: string}>}
 */
export async function exchangeCodeForTokens(code) {
  const msalClient = getMsalClient();
  const response = await msalClient.acquireTokenByCode({
    code,
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
  });

  // Get user email from the Graph API
  const client = getGraphClient(response.accessToken);
  const me = await client.api('/me').select('mail,userPrincipalName').get();

  return {
    access_token: response.accessToken,
    refresh_token: response.idToken, // MSAL doesn't directly expose refresh tokens; we use the account for silent auth
    expiry_date: response.expiresOn ? response.expiresOn.getTime() : Date.now() + 3600 * 1000,
    email: me.mail || me.userPrincipalName,
    account: response.account, // Store for silent token acquisition
  };
}

/**
 * Refresh an expired access token using MSAL silent flow
 * @param {string} refreshToken - Not used directly; MSAL manages token cache
 * @param {Object} [account] - MSAL account object
 * @returns {Promise<{access_token: string, expiry_date: number}>}
 */
export async function refreshAccessToken(refreshToken, account) {
  const msalClient = getMsalClient();

  // If we have an account, try silent acquisition
  if (account) {
    try {
      const response = await msalClient.acquireTokenSilent({
        scopes: SCOPES,
        account,
      });
      return {
        access_token: response.accessToken,
        expiry_date: response.expiresOn ? response.expiresOn.getTime() : Date.now() + 3600 * 1000,
      };
    } catch {
      // Fall through to refresh token flow
    }
  }

  // Fallback: use refresh token directly via HTTP
  const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: SCOPES.join(' '),
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Microsoft token refresh failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Create an event on Microsoft Calendar
 * @param {string} accessToken - Valid access token
 * @param {Object} eventData - Microsoft Graph event resource
 * @returns {Promise<{id: string, webLink: string}>}
 */
export async function createEvent(accessToken, eventData) {
  const client = getGraphClient(accessToken);
  const response = await client.api('/me/events').post(eventData);
  return { id: response.id, webLink: response.webLink };
}

/**
 * Update an existing event on Microsoft Calendar
 * @param {string} accessToken - Valid access token
 * @param {string} externalEventId - Microsoft Graph event ID
 * @param {Object} eventData - Updated event resource
 * @returns {Promise<{id: string}>}
 */
export async function updateEvent(accessToken, externalEventId, eventData) {
  const client = getGraphClient(accessToken);
  const response = await client.api(`/me/events/${externalEventId}`).patch(eventData);
  return { id: response.id };
}

/**
 * Delete an event from Microsoft Calendar
 * @param {string} accessToken - Valid access token
 * @param {string} externalEventId - Microsoft Graph event ID
 */
export async function deleteEvent(accessToken, externalEventId) {
  const client = getGraphClient(accessToken);
  try {
    await client.api(`/me/events/${externalEventId}`).delete();
  } catch (error) {
    // 404 = already deleted, which is fine
    if (error.statusCode === 404) {
      return;
    }
    throw error;
  }
}

/**
 * Create an authenticated Microsoft Graph client
 * @param {string} accessToken - Valid access token
 * @returns {Client} Microsoft Graph client
 */
function getGraphClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
