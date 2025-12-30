/**
 * ============================================
 * POST /api/projects/removeEventGroup
 * ============================================
 *
 * Removes a group from an event and all its participants as attendees.
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

    // Check if group is assigned to this event
    const existingEventGroup = await prisma.event_groups.findFirst({
      where: {
        eventsId: parseInt(eventId),
        groupId: parseInt(groupId)
      }
    });

    if (!existingEventGroup) {
      throw new NotFoundError('Group is not assigned to this event');
    }

    // Get all participants in this group to remove as attendees
    const groupParticipants = await prisma.group_participants.findMany({
      where: {
        groupId: parseInt(groupId)
      },
      include: {
        participant: true
      }
    });

    // Remove each group participant as an event attendee
    const removeAttendeePromises = groupParticipants.map(async (groupParticipant) => {
      return prisma.event_attendees.deleteMany({
        where: {
          eventsId: parseInt(eventId),
          enrolleeId: groupParticipant.participantId
        }
      });
    });

    await Promise.all(removeAttendeePromises);

    // Remove group from event
    await prisma.event_groups.delete({
      where: {
        id: existingEventGroup.id
      }
    });

    return res.status(200).json({
      message: 'Group removed from event successfully',
      removedEventGroupId: existingEventGroup.id
    });

  } catch (error) {
    console.error('Error removing group from event:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
