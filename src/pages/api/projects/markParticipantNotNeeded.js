/**
 * ============================================
 * POST /api/projects/markParticipantNotNeeded
 * ============================================
 *
 * Marks a participant as "not needed" for all events of a specific course.
 * This creates event_attendees records with attendance_status = 'not_needed'
 * for all course events that the participant doesn't already have a record for.
 *
 * Can also unmark (revert) by deleting those records.
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
    const { courseId, enrolleeId, projectId, action = 'mark' } = req.body;

    if (!courseId || !enrolleeId || !projectId) {
      throw new ValidationError('Course ID, enrollee ID, and project ID are required');
    }

    if (!['mark', 'unmark'].includes(action)) {
      throw new ValidationError('Action must be "mark" or "unmark"');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify participant belongs to this project
    // enrolleeId is actually project_participants.id
    const participant = await prisma.project_participants.findFirst({
      where: {
        id: parseInt(enrolleeId),
        projectId: parseInt(projectId)
      }
    });

    if (!participant) {
      throw new NotFoundError('Participant not found in this project');
    }

    // Find all events for this course in the project
    const courseEvents = await prisma.events.findMany({
      where: {
        projectId: parseInt(projectId),
        courseId: parseInt(courseId)
      },
      select: { id: true }
    });

    if (courseEvents.length === 0) {
      throw new NotFoundError('No events found for this course in the project');
    }

    const eventIds = courseEvents.map(e => e.id);

    if (action === 'mark') {
      // Create "not_needed" records for all events that don't have one
      const results = await Promise.all(
        eventIds.map(async (eventId) => {
          // Check if record already exists
          const existing = await prisma.event_attendees.findFirst({
            where: {
              eventsId: eventId,
              enrolleeId: parseInt(enrolleeId)
            }
          });

          if (existing) {
            // If existing record is not 'not_needed', update it
            if (existing.attendance_status !== 'not_needed') {
              return prisma.event_attendees.update({
                where: { id: existing.id },
                data: {
                  attendance_status: 'not_needed',
                  updatedby: orgContext.userId
                }
              });
            }
            return existing; // Already marked as not_needed
          }

          // Create new record with not_needed status
          return prisma.event_attendees.create({
            data: {
              eventsId: eventId,
              enrolleeId: parseInt(enrolleeId),
              attendanceType: 'individual',
              attendance_status: 'not_needed',
              createdBy: orgContext.userId,
              updatedby: orgContext.userId
            }
          });
        })
      );

      return res.status(200).json({
        message: 'Participant marked as not needed for all course events',
        eventsUpdated: results.length
      });

    } else {
      // Unmark: Delete all "not_needed" records for this participant and course events
      const deleteResult = await prisma.event_attendees.deleteMany({
        where: {
          eventsId: { in: eventIds },
          enrolleeId: parseInt(enrolleeId),
          attendance_status: 'not_needed'
        }
      });

      return res.status(200).json({
        message: 'Participant unmarked from not needed status',
        eventsUpdated: deleteResult.count
      });
    }

  } catch (error) {
    console.error('Error marking participant as not needed:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
