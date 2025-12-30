/**
 * ============================================
 * POST /api/projects/fetchParticipantsDetails
 * ============================================
 *
 * Returns participants for a specific project.
 * FIXED: Previously allowed access to any project without org validation.
 *
 * Request Body:
 * {
 *   projectId: number
 * }
 *
 * Response:
 * [
 *   {
 *     participant: {...},
 *     group: {...},
 *     training_recipient: {...}
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

  // Validate projectId
  if (!projectId || isNaN(parseInt(projectId))) {
    throw new ValidationError('Invalid project ID');
  }

  // First verify project exists and belongs to organization
  const project = await scopedFindUnique(orgContext, 'projects', {
    where: { id: parseInt(projectId) }
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Fetch project participants (already org-scoped through project validation)
  const projectParticipants = await prisma.project_participants.findMany({
    where: {
      projectId: parseInt(projectId),
      status: { not: 'removed' } // Only fetch active participants
    },
    include: {
      participant: {
        include: {
          training_recipient: true,
          role: true,
          toolAccesses: {
            where: {
              isActive: true
            },
            orderBy: {
              tool: 'asc'
            }
          }
        }
      },
      training_recipient: true,
      group: {
        include: {
          group: true
        }
      }
    },
    orderBy: {
      id: 'desc'
    }
  });

  // Set cache headers for better performance
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

  return res.status(200).json(projectParticipants);
}

export default withOrgScope(asyncHandler(handler));
