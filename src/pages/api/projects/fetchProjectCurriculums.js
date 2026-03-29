/**
 * ============================================
 * POST /api/projects/fetchProjectCurriculums
 * ============================================
 *
 * Fetches all curriculums for a specific project.
 * FIXED: Previously accepted any projectId without validation.
 */

import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { orgContext } = req;

    try {
    const { projectId } = req.body;

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const projectCurriculums = await prisma.projects.findUnique({
      where: {
        id: projectId
      },
      select: {
        project_curriculums: {
          select: {
            curriculum: {
              select: {
                id: true,
                title: true,
                curriculum_courses: {
                  select: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                        modules: {
                          select: {
                            id: true,
                            customDuration: true,
                            activities: {
                              select: {
                                duration: true
                              }
                            }
                          }
                        },
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

    res.status(200).json(projectCurriculums.project_curriculums);
    } catch (error) {
      console.error('Error fetching project curriculums:', error);
      throw error;
    }
  }
});
