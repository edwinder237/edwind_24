/**
 * ============================================
 * POST /api/projects/removeEventParticipant
 * ============================================
 *
 * Removes a participant from an event.
 * FIXED: Previously accepted any eventId/participantId without validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { eventId, participantId } = req.body;

    if (!eventId || !participantId) {
      throw new ValidationError('Event ID and participant ID are required');
    }

    const parsedEventId = parseInt(eventId);

    // participantId could be either:
    // 1. An integer (project_participants.id / enrolleeId) - used directly
    // 2. A UUID string (participants.id) - need to look up project_participants.id first
    let enrolleeId;

    // Check if participantId is a UUID (contains hyphens) or an integer
    const isUUID = typeof participantId === 'string' && participantId.includes('-');
    const parsedParticipantId = parseInt(participantId);

    if (!isUUID && typeof participantId === 'number') {
      // It's already a number, use directly as enrolleeId
      enrolleeId = participantId;
    } else if (!isUUID && !isNaN(parsedParticipantId) && parsedParticipantId.toString() === participantId.toString()) {
      // It's a valid integer string (like "229"), use as enrolleeId
      enrolleeId = parsedParticipantId;
    } else {
      // It's a UUID, need to find the project_participants record

      // Get event to find projectId
      const event = await prisma.events.findUnique({
        where: { id: parsedEventId },
        select: { projectId: true }
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Verify project ownership
      const project = await scopedFindUnique(orgContext, 'projects', {
        where: { id: event.projectId }
      });

      if (!project) {
        throw new NotFoundError('Event not found');
      }

      // Find the project_participants record
      const projectParticipant = await prisma.project_participants.findFirst({
        where: {
          participantId: participantId,
          projectId: event.projectId
        },
        select: { id: true }
      });

      if (!projectParticipant) {
        throw new NotFoundError('Participant not enrolled in this project');
      }

      enrolleeId = projectParticipant.id;
    }

    // If we have enrolleeId as integer, still need to validate event ownership
    if (!isUUID) {
      const event = await prisma.events.findUnique({
        where: { id: parsedEventId },
        select: { projectId: true }
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Verify project ownership
      const project = await scopedFindUnique(orgContext, 'projects', {
        where: { id: event.projectId }
      });

      if (!project) {
        throw new NotFoundError('Event not found');
      }
    }

    // Find the existing attendee record
    const existingAttendee = await prisma.event_attendees.findFirst({
      where: {
        eventsId: parsedEventId,
        enrolleeId: enrolleeId
      }
    });

    if (!existingAttendee) {
      throw new NotFoundError('Participant not found in this event');
    }

    // Remove participant from event
    await prisma.event_attendees.delete({
      where: {
        id: existingAttendee.id
      }
    });

    return res.status(200).json({
      message: 'Participant removed from event successfully'
    });

  } catch (error) {
    console.error('Error removing participant from event:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
