/**
 * ============================================
 * POST /api/projects/reassign
 * ============================================
 *
 * Reassigns project ownership to another user within the organization.
 *
 * Body:
 * - projectId (required): Project ID to reassign
 * - newUserId (required): User ID of the new owner
 *
 * Response:
 * {
 *   success: true,
 *   message: 'Project reassigned successfully',
 *   project: {...}
 * }
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedUpdate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { projectId, newUserId } = req.body;

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (!newUserId) {
      throw new ValidationError('New user ID is required');
    }

    // Verify project exists and belongs to the organization
    const existingProject = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    // Verify the new user exists and belongs to the same organization
    // Users are linked to organizations via their sub_organization
    const newUser = await prisma.user.findFirst({
      where: {
        id: newUserId,
        sub_organizationId: {
          in: orgContext.subOrganizationIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!newUser) {
      throw new NotFoundError('User not found in your organization');
    }

    // Check if user is already the owner (CreatedBy is the foreign key field in projects)
    if (existingProject.CreatedBy === newUserId) {
      return res.status(400).json({
        success: false,
        message: 'User is already the owner of this project'
      });
    }

    // Update the project owner using Prisma relation connect syntax
    // The projects model uses 'CreatedBy' as the FK and 'user' as the relation name
    const updatedProject = await scopedUpdate(orgContext, 'projects', {
      where: {
        id: parseInt(projectId)
      },
      data: {
        user: {
          connect: { id: newUserId }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        training_recipient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Project reassigned to ${newUser.name}`,
      project: updatedProject,
      previousOwner: existingProject.user,
      newOwner: newUser
    });
  } catch (error) {
    console.error('Error reassigning project:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
