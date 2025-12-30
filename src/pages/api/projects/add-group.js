/**
 * ============================================
 * POST /api/projects/add-group
 * ============================================
 *
 * Creates a new group in a project and syncs with curriculums.
 * FIXED: Previously accepted any projectId without validation.
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
    const { newGroup, index, projectId } = req.body;

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (!newGroup || !newGroup.groupName) {
      throw new ValidationError('Group name is required');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Create the group in the database
    const createdGroup = await prisma.groups.create({
      data: {
        groupName: newGroup.groupName,
        chipColor: newGroup.chipColor || '#1976d2',
        projectId: parseInt(projectId),
      }
    });

    // Add participants to the group if any were selected
    if (newGroup.employees && newGroup.employees.length > 0) {
      const groupParticipants = newGroup.employees.map(employee => ({
        groupId: createdGroup.id,
        participantId: employee.id,
      }));

      await prisma.group_participants.createMany({
        data: groupParticipants,
        skipDuplicates: true, // Avoid conflicts if participant already in group
      });
    }

    // Automatically assign all project curriculums to the new group
    const projectCurriculums = await prisma.project_curriculums.findMany({
      where: { projectId: parseInt(projectId) },
      select: { curriculumId: true }
    });

    if (projectCurriculums.length > 0) {
      const groupCurriculums = projectCurriculums.map(pc => ({
        groupId: createdGroup.id,
        curriculumId: pc.curriculumId,
        isActive: true,
        assignedAt: new Date(),
        assignedBy: 'system'
      }));

      await prisma.group_curriculums.createMany({
        data: groupCurriculums,
        skipDuplicates: true
      });
    }

    // Fetch the complete group with participants and curriculums
    const groupWithParticipants = await prisma.groups.findUnique({
      where: { id: createdGroup.id },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
        group_curriculums: {
          include: {
            curriculum: true,
          },
        },
      },
    });

    // Fetch all groups for this project to return complete list
    const allProjectGroups = await prisma.groups.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
        group_curriculums: {
          include: {
            curriculum: true,
          },
        },
      },
    });

    // Return format compatible with RTK Query mutation
    const result = {
      success: true,
      group: groupWithParticipants, // RTK Query expects 'group' key
      newGroupsArray: allProjectGroups,
      projectIndex: index,
      createdGroup: groupWithParticipants, // Legacy format for backward compatibility
      projectId: parseInt(projectId)
    };

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));