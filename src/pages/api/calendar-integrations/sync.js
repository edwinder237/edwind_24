/**
 * POST /api/calendar-integrations/sync
 *
 * Triggers a full sync of all events for the current user.
 * Optionally scoped to a specific project.
 */

import { attachUserClaims } from '../../../lib/auth/middleware';
import { syncAllProjectEvents } from '../../../lib/calendar/calendarSyncService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await attachUserClaims(req, res);

  const userId = req.userClaims?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { projectId, syncScope = 'future' } = req.body || {};
  const futureOnly = syncScope !== 'all';

  try {
    const result = await syncAllProjectEvents(userId, projectId, { futureOnly });
    const scopeLabel = futureOnly ? 'upcoming' : '';
    res.status(200).json({
      success: true,
      message: `Synced ${result.synced} ${scopeLabel} events${result.errors > 0 ? ` with ${result.errors} errors` : ''}`.replace('  ', ' '),
      ...result,
    });
  } catch (error) {
    console.error('[CALENDAR_INTEGRATIONS] Sync error:', error.message);
    res.status(500).json({ error: 'Failed to sync calendar events' });
  }
}
