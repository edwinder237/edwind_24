/**
 * ============================================
 * POST /api/projects/fetchParticipants
 * ============================================
 *
 * Returns all active participants for a project.
 * FIXED: Previously leaked participant data across organizations.
 *
 * Body:
 * - projectId (required): Project ID to fetch participants for
 *
 * Response:
 * [
 *   {
 *     id: number,
 *     participant: {...},
 *     status: string
 *   }
 * ]
 */

import prisma from '../../../lib/prisma';
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
    const projectParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: parseInt(projectId),
        status: { not: "removed" } // Only fetch active participants
      },
      include: {
        participant: {
          include: {
            training_recipient: true, // Include training recipient info
            role: true, // Include role information
            toolAccesses: {
              where: {
                isActive: true // Only include active tool accesses
              },
              orderBy: {
                tool: 'asc' // Sort tools alphabetically
              }
            }
          }
        }
      },
      orderBy: {
        id: "desc", // or 'asc' for ascending order
      },
    });

    res.status(200).json(projectParticipants);
  } catch (error) {
    console.error('[fetchParticipants] Error:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));