import prisma from "../../../lib/prisma";
import { attachUserClaims } from "../../../lib/auth/middleware";
import { syncEventToCalendars } from "../../../lib/calendar/calendarSyncService";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    await attachUserClaims(req, res);

    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    try {
      // Convert eventId to integer if it's a string
      const id = parseInt(eventId);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      // Pre-capture calendar event mappings before deletion (cascade will remove them)
      const mappings = await prisma.calendar_event_mappings.findMany({
        where: { eventId: id },
      });

      await prisma.events.delete({
        where: {
          id: id
        }
      });

      // Check if user has active calendar integrations
      const userId = req.userClaims?.userId;
      let calendarSyncTriggered = false;
      if (userId) {
        const activeIntegrations = await prisma.calendar_integrations.count({
          where: { userId, isActive: true }
        });
        calendarSyncTriggered = activeIntegrations > 0 && mappings.length > 0;
      }

      res.status(200).json({ message: "Event deleted and removed from database", success: true, calendarSyncTriggered });

      // Calendar sync — delete from external calendars (non-blocking, fire-and-forget)
      if (calendarSyncTriggered) {
        syncEventToCalendars(id, 'delete', userId, mappings).catch(err =>
          console.error('[CALENDAR_SYNC] Delete sync failed:', err.message)
        );
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
