/**
 * ============================================
 * POST /api/projects/add-curriculum
 * ============================================
 *
 * Adds a curriculum to a project and syncs with all groups.
 * FIXED: Previously accepted any projectId without validation.
 */

import prisma from '../../../lib/prisma';
import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { projectId, curriculumId } = req.body;

    if (!projectId || !curriculumId) {
      throw new ValidationError('Project ID and Curriculum ID are required');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify curriculum belongs to same organization
    const curriculum = await scopedFindUnique(orgContext, 'curriculums', {
      where: { id: parseInt(curriculumId) }
    });

    if (!curriculum) {
      throw new NotFoundError('Curriculum not found');
    }

    // Check if curriculum is already assigned to this specific project
    const existingRelation = await prisma.project_curriculums.findUnique({
      where: {
        projectId_curriculumId: {
          projectId: parseInt(projectId),
          curriculumId: parseInt(curriculumId)
        }
      }
    });

    if (existingRelation) {
      return res.status(400).json({ 
        success: false, 
        message: 'Curriculum is already added to this project' 
      });
    }

    // Create the relationship
    const projectCurriculum = await prisma.project_curriculums.create({
      data: {
        projectId: parseInt(projectId),
        curriculumId: parseInt(curriculumId)
      },
      include: {
        curriculum: {
          include: {
            curriculum_courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    summary: true,
                    level: true,
                    modules: {
                      include: {
                        activities: {
                          select: {
                            duration: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Automatically add the curriculum to all existing groups in the project
    const projectGroups = await prisma.groups.findMany({
      where: { projectId: parseInt(projectId) },
      select: { id: true }
    });

    if (projectGroups.length > 0) {
      const groupCurriculums = projectGroups.map(group => ({
        groupId: group.id,
        curriculumId: parseInt(curriculumId),
        isActive: true,
        assignedAt: new Date(),
        assignedBy: 'system'
      }));

      await prisma.group_curriculums.createMany({
        data: groupCurriculums,
        skipDuplicates: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Curriculum added to project and synced with all groups successfully',
      data: projectCurriculum
    });

  } catch (error) {
    console.error('Error adding curriculum to project:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));