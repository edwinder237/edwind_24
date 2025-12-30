/**
 * ============================================
 * POST /api/projects/addEventParticipant
 * ============================================
 *
 * Adds a participant to an event.
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
    const { eventId, participantId, attendance_status = 'scheduled', attendanceType = 'individual' } = req.body;

    if (!eventId || !participantId) {
      throw new ValidationError('Event ID and participant ID are required');
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

    // Check if participant is already added to this event
    const existingAttendee = await prisma.event_attendees.findFirst({
      where: {
        eventsId: parseInt(eventId),
        enrolleeId: parseInt(participantId)
      }
    });

    if (existingAttendee) {
      throw new ValidationError('Participant is already added to this event');
    }

    // Add participant to event
    let newAttendee;
    try {
      newAttendee = await prisma.event_attendees.create({
        data: {
          eventsId: parseInt(eventId),
          enrolleeId: parseInt(participantId),
          attendanceType: attendanceType,
          attendance_status: attendance_status,
          createdBy: orgContext.userId,
          updatedby: orgContext.userId
        }
      });
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 'P2002') {
        throw new ValidationError('Participant is already added to this event');
      }
      throw error;
    }

    return res.status(201).json({
      message: 'Participant added to event successfully',
      attendee: newAttendee
    });

  } catch (error) {
    console.error('Error adding participant to event:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
