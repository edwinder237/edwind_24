/**
 * GET /api/calendar-integrations
 *
 * Returns the current user's calendar integrations.
 * Never exposes tokens — only metadata.
 */

import prisma from '../../../lib/prisma';
import { attachUserClaims } from '../../../lib/auth/middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await attachUserClaims(req, res);

  const userId = req.userClaims?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const integrations = await prisma.calendar_integrations.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerEmail: true,
        calendarId: true,
        isActive: true,
        lastSyncAt: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ integrations });
  } catch (error) {
    console.error('[CALENDAR_INTEGRATIONS] List error:', error.message);
    res.status(500).json({ error: 'Failed to fetch calendar integrations' });
  }
}
