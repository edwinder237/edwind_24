/**
 * ============================================
 * POST /api/events/assignInstructor
 * ============================================
 *
 * Assigns an instructor to an event.
 * FIXED: Previously accepted any eventId/instructorId without validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { eventId, instructorId, role = 'main' } = req.body;

    if (!eventId || !instructorId) {
      throw new ValidationError('Event ID and Instructor ID are required');
    }

    // Get event and verify it belongs to a project in user's org
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
      select: { id: true, projectId: true }
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify project ownership (which validates event ownership)
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: event.projectId }
    });

    if (!project) {
      throw new NotFoundError('Event not found');
    }

    // Verify instructor belongs to same organization
    const instructor = await scopedFindUnique(orgContext, 'instructors', {
      where: { id: parseInt(instructorId) }
    });

    if (!instructor) {
      throw new NotFoundError('Instructor not found');
    }

    // Check if instructor is already assigned to this event
    const existingAssignment = await prisma.event_instructors.findUnique({
      where: {
        eventId_instructorId: {
          eventId: parseInt(eventId),
          instructorId: parseInt(instructorId)
        }
      }
    });

    if (existingAssignment) {
      throw new ValidationError('Instructor is already assigned to this event');
    }

    // Create the assignment
    const assignment = await prisma.event_instructors.create({
      data: {
        eventId: parseInt(eventId),
        instructorId: parseInt(instructorId),
        role
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            instructorType: true,
            expertise: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            start: true,
            end: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Instructor assigned to event successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error assigning instructor to event:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
