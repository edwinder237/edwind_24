import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { NotFoundError, ValidationError } from '../../../lib/errors/index.js';
import { syncEventToCalendars } from '../../../lib/calendar/calendarSyncService';

export default createHandler({
  POST: async (req, res) => {
    const { event, eventId } = req.body;

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const parsedEventId = parseInt(eventId);

    // Verify the event belongs to a project in the user's org
    const existingEvent = await prisma.events.findUnique({
      where: { id: parsedEventId },
      include: { project: { select: { sub_organizationId: true } } }
    });

    if (!existingEvent || !req.orgContext.subOrganizationIds.includes(existingEvent.project.sub_organizationId)) {
      throw new NotFoundError('Event not found');
    }

    // Clean the event data to only include database fields
    const extendedProps = {
      ...(event.extendedProps || {}),
      ...(event.location !== undefined && { location: event.location })
    };

    // Clear physical location from extendedProps when switching to remote
    if (event.deliveryMode === 'remote') {
      delete extendedProps.location;
    }

    const updateData = {
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      start: event.start ? new Date(event.start) : undefined,
      end: event.end ? new Date(event.end) : undefined,
      allDay: event.allDay,
      color: event.color,
      textColor: event.textColor,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      editable: event.editable,
      eventStatus: event.eventStatus,
      extendedProps: Object.keys(extendedProps).length > 0 ? extendedProps : undefined,
      timezone: event.timezone,
      deliveryMode: event.deliveryMode,
      meetingLink: event.meetingLink,
      ...(event.courseId !== undefined && { courseId: event.courseId }),
      ...(event.supportActivityId !== undefined && { supportActivityId: event.supportActivityId }),
      ...(event.roomId !== undefined && { roomId: event.roomId })
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Use transaction to update both event and groups
    const result = await prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.events.update({
        where: { id: parsedEventId },
        data: updateData,
      });

      // Handle instructor assignment if instructor is provided
      if (event.instructor !== undefined) {
        const instructorId = event.instructor?.id ? parseInt(event.instructor.id) : null;

        await tx.event_instructors.deleteMany({
          where: { eventId: parsedEventId }
        });

        if (instructorId) {
          await tx.event_instructors.create({
            data: {
              eventId: parsedEventId,
              instructorId: instructorId,
              role: 'lead'
            }
          });
        }
      }

      // Handle group assignments if selectedGroups is provided
      if (event.selectedGroups !== undefined) {
        const currentGroupAssignments = await tx.event_groups.findMany({
          where: { eventsId: parsedEventId },
          select: { groupId: true }
        });

        const currentGroupIds = currentGroupAssignments.map(eg => eg.groupId);
        const newGroupIds = event.selectedGroups.map(id => parseInt(id)).filter(id => !isNaN(id));

        const groupsToRemove = currentGroupIds.filter(currentId => !newGroupIds.includes(currentId));
        const groupsToAdd = newGroupIds.filter(newId => !currentGroupIds.includes(newId));

        // Remove attendees from groups that are being removed
        if (groupsToRemove.length > 0) {
          for (const removedGroupId of groupsToRemove) {
            const groupParticipants = await tx.group_participants.findMany({
              where: { groupId: removedGroupId },
              select: { participantId: true }
            });

            if (groupParticipants.length > 0) {
              const participantIds = groupParticipants.map(gp => gp.participantId);
              await tx.event_attendees.deleteMany({
                where: {
                  eventsId: parsedEventId,
                  enrolleeId: { in: participantIds }
                }
              });
            }
          }
        }

        // Update group assignments
        await tx.event_groups.deleteMany({
          where: { eventsId: parsedEventId }
        });

        if (newGroupIds.length > 0) {
          const groupAssignments = newGroupIds.map(groupId => ({
            eventsId: parsedEventId,
            groupId: groupId
          }));

          await tx.event_groups.createMany({
            data: groupAssignments
          });

          // Add attendees from newly assigned groups
          for (const groupId of groupsToAdd) {
            const groupParticipants = await tx.group_participants.findMany({
              where: { groupId: groupId },
              select: { participantId: true }
            });

            if (groupParticipants.length > 0) {
              const attendeeData = groupParticipants.map(gp => ({
                eventsId: parsedEventId,
                enrolleeId: gp.participantId,
                attendance_status: 'scheduled',
                createdBy: updatedEvent.updatedby || updatedEvent.createdBy,
                updatedby: updatedEvent.updatedby || updatedEvent.createdBy
              }));

              for (const attendee of attendeeData) {
                await tx.event_attendees.upsert({
                  where: {
                    eventsId_enrolleeId: {
                      eventsId: attendee.eventsId,
                      enrolleeId: attendee.enrolleeId
                    }
                  },
                  update: {
                    attendance_status: attendee.attendance_status,
                    updatedby: attendee.updatedby,
                    lastUpdated: new Date()
                  },
                  create: attendee
                });
              }
            }
          }
        }
      }

      return updatedEvent;
    });

    // Single query: resolve user and check for active calendar integrations
    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: req.orgContext.userId },
      select: { id: true, calendar_integrations: { where: { isActive: true }, select: { id: true }, take: 1 } },
    });
    const calendarSyncTriggered = dbUser?.calendar_integrations?.length > 0;

    res.status(200).json({
      success: true,
      message: 'Event and group assignments updated successfully',
      updatedEvent: result,
      calendarSyncTriggered
    });

    // Calendar sync (non-blocking, fire-and-forget)
    if (calendarSyncTriggered) {
      syncEventToCalendars(parsedEventId, 'update', dbUser.id).catch(err =>
        console.error('[CALENDAR_SYNC] Update sync failed:', err.message)
      );
    }
  }
});
