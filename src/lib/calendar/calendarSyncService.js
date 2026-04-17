/**
 * Calendar Sync Service
 *
 * Orchestrates one-way push sync from EDBAHN events to external calendars
 * (Google Calendar, Microsoft Outlook). This is the main entry point
 * called by event CRUD operations.
 */

import prisma from '../prisma.js';
import { encrypt, decrypt } from './encryption.js';
import { mapToGoogleEvent, mapToMicrosoftEvent } from './eventMapper.js';
import * as googleService from './googleCalendarService.js';
import * as microsoftService from './microsoftCalendarService.js';

/**
 * Sync a single event to all of a user's connected external calendars.
 * This is fire-and-forget — errors are logged but never thrown.
 *
 * @param {number} eventId - EDBAHN event ID
 * @param {'create'|'update'|'delete'} action - The CRUD action that triggered sync
 * @param {string} userId - User ID who performed the action
 * @param {Object} [preDeleteMappings] - Pre-captured mappings for delete actions (since event is gone)
 */
export async function syncEventToCalendars(eventId, action, userId, preDeleteMappings = null) {
  try {
    // Get user's active calendar integrations
    const integrations = await prisma.calendar_integrations.findMany({
      where: { userId, isActive: true },
    });

    if (integrations.length === 0) return;

    // Fetch event data (not needed for delete if we have pre-captured mappings)
    const SYNCABLE_STATUSES = ['Planning', 'Scheduled', 'In Progress'];
    let event = null;
    if (action !== 'delete') {
      event = await prisma.events.findUnique({
        where: { id: eventId },
        include: {
          project: { select: { title: true, projectStatus: true } },
          course: { select: { title: true } },
          room: { select: { name: true, location: true, capacity: true } },
        },
      });

      if (!event) {
        console.error(`[CALENDAR_SYNC] Event ${eventId} not found`);
        return;
      }

      // Skip sync for projects not in an active status
      if (event.project && !SYNCABLE_STATUSES.includes(event.project.projectStatus)) {
        return;
      }
    }

    // Process each integration
    for (const integration of integrations) {
      try {
        await syncToProvider(integration, event, eventId, action, preDeleteMappings);
      } catch (error) {
        console.error(`[CALENDAR_SYNC] Failed to sync event ${eventId} to ${integration.provider}:`, error.message);
        // Log the error on the integration record
        await prisma.calendar_integrations.update({
          where: { id: integration.id },
          data: { lastSyncError: error.message },
        }).catch(() => {}); // Don't fail if we can't even log the error
      }
    }
  } catch (error) {
    console.error(`[CALENDAR_SYNC] syncEventToCalendars failed:`, error.message);
  }
}

/**
 * Sync a single event to a specific provider
 */
async function syncToProvider(integration, event, eventId, action, preDeleteMappings) {
  // Get valid access token (refresh if expired)
  const accessToken = await getValidAccessToken(integration);

  const provider = integration.provider;
  const calendarId = integration.calendarId || 'primary';

  if (action === 'create') {
    await handleCreate(integration, event, eventId, accessToken, provider, calendarId);
  } else if (action === 'update') {
    await handleUpdate(integration, event, eventId, accessToken, provider, calendarId);
  } else if (action === 'delete') {
    await handleDelete(integration, eventId, accessToken, provider, calendarId, preDeleteMappings);
  }

  // Update last sync timestamp
  await prisma.calendar_integrations.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date(), lastSyncError: null },
  });
}

/**
 * Handle creating an event on external calendar
 */
async function handleCreate(integration, event, eventId, accessToken, provider, calendarId) {
  const eventData = provider === 'google' ? mapToGoogleEvent(event) : mapToMicrosoftEvent(event);

  let result;
  if (provider === 'google') {
    result = await googleService.createEvent(accessToken, eventData, calendarId);
  } else {
    result = await microsoftService.createEvent(accessToken, eventData);
  }

  // Store the mapping
  await prisma.calendar_event_mappings.create({
    data: {
      eventId,
      integrationId: integration.id,
      externalEventId: result.id,
      syncStatus: 'synced',
    },
  });
}

/**
 * Handle updating an event on external calendar
 */
async function handleUpdate(integration, event, eventId, accessToken, provider, calendarId) {
  // Find existing mapping
  const mapping = await prisma.calendar_event_mappings.findUnique({
    where: {
      eventId_integrationId: {
        eventId,
        integrationId: integration.id,
      },
    },
  });

  const eventData = provider === 'google' ? mapToGoogleEvent(event) : mapToMicrosoftEvent(event);

  if (mapping) {
    // Update existing external event
    try {
      if (provider === 'google') {
        await googleService.updateEvent(accessToken, mapping.externalEventId, eventData, calendarId);
      } else {
        await microsoftService.updateEvent(accessToken, mapping.externalEventId, eventData);
      }

      await prisma.calendar_event_mappings.update({
        where: { id: mapping.id },
        data: { lastSyncedAt: new Date(), syncStatus: 'synced', lastError: null },
      });
    } catch (error) {
      // If the external event was deleted, create a new one
      if (error.code === 404 || error.code === 410 || error.statusCode === 404) {
        await prisma.calendar_event_mappings.delete({ where: { id: mapping.id } });
        await handleCreate(integration, event, eventId, accessToken, provider, calendarId);
      } else {
        throw error;
      }
    }
  } else {
    // No mapping exists, create a new event (happens if sync was added after event creation)
    await handleCreate(integration, event, eventId, accessToken, provider, calendarId);
  }
}

/**
 * Handle deleting an event from external calendar
 */
async function handleDelete(integration, eventId, accessToken, provider, calendarId, preDeleteMappings) {
  // Use pre-captured mappings if available, otherwise try to find in DB
  let mapping;
  if (preDeleteMappings) {
    mapping = preDeleteMappings.find(m => m.integrationId === integration.id);
  } else {
    mapping = await prisma.calendar_event_mappings.findUnique({
      where: {
        eventId_integrationId: {
          eventId,
          integrationId: integration.id,
        },
      },
    });
  }

  if (!mapping) return;

  // Delete from external calendar
  if (provider === 'google') {
    await googleService.deleteEvent(accessToken, mapping.externalEventId, calendarId);
  } else {
    await microsoftService.deleteEvent(accessToken, mapping.externalEventId);
  }

  // Delete the mapping (cascade should handle this if event is already deleted, but be safe)
  await prisma.calendar_event_mappings.delete({
    where: { id: mapping.id },
  }).catch(() => {}); // May already be deleted via cascade
}

/**
 * Get a valid access token for an integration, refreshing if expired
 * @param {Object} integration - calendar_integrations record
 * @returns {Promise<string>} Valid access token
 */
async function getValidAccessToken(integration) {
  const accessToken = decrypt(integration.accessToken);
  const refreshToken = integration.refreshToken ? decrypt(integration.refreshToken) : null;

  // Check if token is expired (with 5 minute buffer)
  const isExpired = integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000);

  if (!isExpired) {
    return accessToken;
  }

  if (!refreshToken) {
    throw new Error(`${integration.provider} access token expired and no refresh token available. Please reconnect.`);
  }

  // Refresh the token
  let newTokens;
  if (integration.provider === 'google') {
    newTokens = await googleService.refreshAccessToken(refreshToken);
  } else {
    newTokens = await microsoftService.refreshAccessToken(refreshToken);
  }

  // Update stored tokens
  await prisma.calendar_integrations.update({
    where: { id: integration.id },
    data: {
      accessToken: encrypt(newTokens.access_token),
      ...(newTokens.refresh_token && { refreshToken: encrypt(newTokens.refresh_token) }),
      tokenExpiresAt: new Date(newTokens.expiry_date),
    },
  });

  return newTokens.access_token;
}

/**
 * Sync all events for a project to a user's external calendars.
 * Used for the "Sync Now" button.
 *
 * @param {string} userId - User ID
 * @param {number} [projectId] - Optional project ID to limit sync
 * @param {Object} [options]
 * @param {boolean} [options.futureOnly=true] - Only sync events ending in the future
 */
export async function syncAllProjectEvents(userId, projectId, { futureOnly = true } = {}) {
  const integrations = await prisma.calendar_integrations.findMany({
    where: { userId, isActive: true },
  });

  if (integrations.length === 0) {
    return { synced: 0, errors: 0 };
  }

  // Find events to sync — only from active project statuses
  const SYNCABLE_STATUSES = ['Planning', 'Scheduled', 'In Progress'];
  const whereClause = {
    ...(projectId ? { projectId: parseInt(projectId) } : {}),
    ...(futureOnly ? { end: { gte: new Date() } } : {}),
    project: { projectStatus: { in: SYNCABLE_STATUSES } },
  };
  const events = await prisma.events.findMany({
    where: whereClause,
    include: {
      project: { select: { title: true } },
      course: { select: { title: true } },
      room: { select: { name: true, location: true, capacity: true } },
      calendar_event_mappings: true,
    },
  });

  let synced = 0;
  let errors = 0;

  for (const event of events) {
    for (const integration of integrations) {
      try {
        const existingMapping = event.calendar_event_mappings.find(
          m => m.integrationId === integration.id
        );

        const accessToken = await getValidAccessToken(integration);
        const provider = integration.provider;
        const calendarId = integration.calendarId || 'primary';

        if (existingMapping) {
          // Update existing
          await handleUpdate(integration, event, event.id, accessToken, provider, calendarId);
        } else {
          // Create new
          await handleCreate(integration, event, event.id, accessToken, provider, calendarId);
        }
        synced++;
      } catch (error) {
        console.error(`[CALENDAR_SYNC] Full sync error for event ${event.id}:`, error.message);
        errors++;
      }
    }
  }

  // Update last sync time on all integrations
  await prisma.calendar_integrations.updateMany({
    where: { userId, isActive: true },
    data: { lastSyncAt: new Date() },
  });

  return { synced, errors, total: events.length };
}

/**
 * Store encrypted tokens for a new integration
 *
 * @param {string} userId - User ID
 * @param {string} provider - "google" or "microsoft"
 * @param {Object} tokens - Token data from OAuth exchange
 * @returns {Promise<Object>} Created calendar_integrations record
 */
export async function storeIntegration(userId, provider, tokens) {
  return await prisma.calendar_integrations.upsert({
    where: {
      userId_provider: { userId, provider },
    },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      providerEmail: tokens.email || null,
      isActive: true,
      lastSyncError: null,
    },
    create: {
      userId,
      provider,
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      providerEmail: tokens.email || null,
      calendarId: provider === 'google' ? 'primary' : null,
    },
  });
}

/**
 * Disconnect a calendar integration
 *
 * @param {string} userId - User ID
 * @param {number} integrationId - Integration record ID
 */
export async function disconnectIntegration(userId, integrationId) {
  // Verify ownership
  const integration = await prisma.calendar_integrations.findFirst({
    where: { id: integrationId, userId },
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  // Delete all event mappings for this integration
  await prisma.calendar_event_mappings.deleteMany({
    where: { integrationId },
  });

  // Deactivate the integration
  await prisma.calendar_integrations.update({
    where: { id: integrationId },
    data: { isActive: false },
  });

}
