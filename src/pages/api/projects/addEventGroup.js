/**
 * ============================================
 * POST /api/projects/addEventGroup
 * ============================================
 *
 * Adds a group to an event and all its participants as attendees.
 * FIXED: Previously accepted any eventId/groupId without validation.
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { eventId, groupId } = req.body;

    if (!eventId || !groupId) {
      throw new ValidationError('Event ID and group ID are required');
    }

    // Get event and verify it belongs to a project in user's org
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
      select: { id: true, projectId: true }
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify project ownership (validates event ownership)
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: event.projectId }
    });

    if (!project) {
      throw new NotFoundError('Event not found');
    }

    // Verify group belongs to the same project
    const group = await prisma.groups.findFirst({
      where: {
        id: parseInt(groupId),
        projectId: event.projectId
      }
    });

    if (!group) {
      throw new NotFoundError('Group not found in this project');
    }

    // Check if group is already added to this event
    const existingEventGroup = await prisma.event_groups.findFirst({
      where: {
        eventsId: parseInt(eventId),
        groupId: parseInt(groupId)
      }
    });

    if (existingEventGroup) {
      throw new ValidationError('Group is already added to this event');
    }

    // Add group to event
    let newEventGroup;
    try {
      newEventGroup = await prisma.event_groups.create({
        data: {
          eventsId: parseInt(eventId),
          groupId: parseInt(groupId)
        }
      });
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 'P2002') {
        throw new ValidationError('Group is already added to this event');
      }
      throw error;
    }

    // Get all participants in this group and add them as attendees
    const groupParticipants = await prisma.group_participants.findMany({
      where: {
        groupId: parseInt(groupId)
      },
      include: {
        participant: true
      }
    });

    // Add each group participant as an event attendee if not already added
    const attendeePromises = groupParticipants.map(async (groupParticipant) => {
      const existingAttendee = await prisma.event_attendees.findFirst({
        where: {
          eventsId: parseInt(eventId),
          enrolleeId: groupParticipant.participantId
        }
      });

      if (!existingAttendee) {
        return prisma.event_attendees.create({
          data: {
            eventsId: parseInt(eventId),
            enrolleeId: groupParticipant.participantId,
            attendanceType: 'group',
            attendance_status: 'scheduled',
            createdBy: orgContext.userId,
            updatedby: orgContext.userId
          }
        });
      }

      return existingAttendee;
    });

    const attendees = await Promise.all(attendeePromises);

    return res.status(201).json({
      message: 'Group added to event successfully',
      eventGroup: newEventGroup,
      attendees: attendees
    });

  } catch (error) {
    console.error('Error adding group to event:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
