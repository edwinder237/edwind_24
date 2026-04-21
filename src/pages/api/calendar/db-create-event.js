import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../lib/errors/index.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { getOrgSubscription } from '../../../lib/features/subscriptionService';
import { canAccessFeature } from '../../../lib/features/featureAccess';
import { createAuditLog } from '../../../lib/utils/auditLog';
import { syncEventToCalendars } from '../../../lib/calendar/calendarSyncService';

export default createHandler({
  POST: async (req, res) => {
    const { newEvent, events, projectId, createdByName } = req.body;

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    // Verify the project belongs to the user's organization
    const project = await scopedFindUnique(req.orgContext, 'projects', {
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check event_management feature access
    const subscription = await getOrgSubscription(req.orgContext.organizationId);
    if (subscription) {
      const featureCheck = canAccessFeature({
        subscription,
        featureKey: 'event_management'
      });
      if (!featureCheck.canAccess) {
        throw new ForbiddenError('Event management is not available on your current plan');
      }
    }

    const event = {
      title: newEvent.title,
      description: newEvent.description,
      eventType: newEvent.eventType || 'other',
      start: newEvent.start,
      end: newEvent.end,
      allDay: newEvent.allDay,
      color: newEvent.color,
      textColor: newEvent.textColor,
      backgroundColor: '#4285F4',
      borderColor: '#000000',
      editable: true,
      eventStatus: 'Active',
      timezone: newEvent.timezone || null,
      deliveryMode: newEvent.deliveryMode || 'in_person',
      meetingLink: newEvent.meetingLink || null,
      extendedProps: {},
      project: { connect: { id: parseInt(projectId) } },
      ...(newEvent.courseId && { course: { connect: { id: parseInt(newEvent.courseId) } } }),
      ...(newEvent.supportActivityId && { supportActivity: { connect: { id: parseInt(newEvent.supportActivityId) } } }),
      ...(newEvent.roomId && { room: { connect: { id: parseInt(newEvent.roomId) } } })
    };

    const createdEvent = await prisma.events.create({
      data: event,
    });

    // Log audit entry if event is linked to a course
    if (newEvent.courseId) {
      const scheduledByName = createdByName || req.orgContext.claims?.name || 'Project Manager';

      await createAuditLog(prisma, {
        courseId: parseInt(newEvent.courseId),
        entityType: 'event',
        entityId: createdEvent.id,
        actionType: 'create',
        metadata: {
          title: newEvent.title,
          eventType: newEvent.eventType || 'other',
          start: newEvent.start,
          end: newEvent.end,
          projectId: parseInt(projectId),
          projectTitle: project.title || 'Unknown Project',
          deliveryMode: newEvent.deliveryMode || 'in_person',
        },
        changedByName: scheduledByName,
      });
    }

    // Single query: resolve user and check for active calendar integrations
    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: req.orgContext.userId },
      select: { id: true, calendar_integrations: { where: { isActive: true, OR: [{ lastSyncError: null }, { lastSyncError: { not: { contains: 'invalid_grant' } } }] }, select: { id: true }, take: 1 } },
    });
    const calendarSyncTriggered = dbUser?.calendar_integrations?.length > 0;

    res.status(200).json({
      message: `${newEvent.title} Event created and saved to database`,
      calendarSyncTriggered
    });

    // Calendar sync (non-blocking, fire-and-forget)
    if (calendarSyncTriggered) {
      syncEventToCalendars(createdEvent.id, 'create', dbUser.id).catch(err =>
        console.error('[CALENDAR_SYNC] Create sync failed:', err.message)
      );
    }
  }
});
