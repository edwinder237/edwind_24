/**
 * ============================================
 * POST /api/projects/fetchEvents
 * ============================================
 *
 * Returns all events for a project with course and attendance data.
 * FIXED: Previously leaked event data across organizations.
 *
 * Body:
 * - projectId (required): Project ID to fetch events for
 *
 * Response:
 * {
 *   events: [...]
 * }
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { projectId } = req.body;
  const { orgContext } = req;

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  // Verify project ownership
  const projectOwnership = await scopedFindUnique(orgContext, 'projects', {
    where: { id: parseInt(projectId) }
  });

  if (!projectOwnership) {
    throw new NotFoundError('Project not found');
  }

  try {
    const events = await prisma.events.findMany({
      where: {
        projectId: projectId,
      },
      
        include: {
          course: {
            include: {
              modules: {
                include: {
                  activities: {
                    orderBy: {
                      ActivityOrder: 'asc'
                    }
                  }
                },
                orderBy: {
                  moduleOrder: 'asc'
                }
              }
            }
          },
          supportActivity: {
            include: {
              curriculum: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          event_attendees: {
            include: {
              enrollee:{
                select:{
                  participant:true
                }
              }
            }
          },
          event_groups:{
            include:{
              groups:{
                select:{
                  id: true,
                  groupName: true,
                  chipColor: true,
                  projectId: true
                  // Don't include participants - they should come from event_attendees only
                }
              }
            }
          }
        },
      
    });

    res.status(200).json({ events });
  } catch (error) {
    console.error('[fetchEvents] Error:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
