import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { NotFoundError, ValidationError } from '../../../lib/errors/index.js';
import { syncEventToCalendars } from '../../../lib/calendar/calendarSyncService';

export default createHandler({
  POST: async (req, res) => {
    const { eventId } = req.body;

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const id = parseInt(eventId);
    if (isNaN(id)) {
      throw new ValidationError('Invalid event ID');
    }

    // Verify the event belongs to a project in the user's org
    const event = await prisma.events.findUnique({
      where: { id },
      include: { project: { select: { sub_organizationId: true } } }
    });

    if (!event || !req.orgContext.subOrganizationIds.includes(event.project.sub_organizationId)) {
      throw new NotFoundError('Event not found');
    }

    // Pre-capture calendar event mappings before deletion (cascade will remove them)
    const mappings = await prisma.calendar_event_mappings.findMany({
      where: { eventId: id },
    });

    await prisma.events.delete({
      where: { id }
    });

    // Check if user has active calendar integrations
    const userId = req.orgContext.userId;
    let calendarSyncTriggered = false;
    if (userId) {
      const activeIntegrations = await prisma.calendar_integrations.count({
        where: { userId, isActive: true }
      });
      calendarSyncTriggered = activeIntegrations > 0 && mappings.length > 0;
    }

    res.status(200).json({ message: 'Event deleted and removed from database', success: true, calendarSyncTriggered });

    // Calendar sync — delete from external calendars (non-blocking, fire-and-forget)
    if (calendarSyncTriggered) {
      syncEventToCalendars(id, 'delete', userId, mappings).catch(err =>
        console.error('[CALENDAR_SYNC] Delete sync failed:', err.message)
      );
    }
  }
});
