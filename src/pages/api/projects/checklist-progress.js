/**
 * ============================================
 * /api/projects/checklist-progress
 * ============================================
 *
 * Manages project checklist progress (both course and curriculum items).
 * FIXED: Previously leaked checklist data across organizations.
 *
 * Methods:
 * - GET: Fetch checklist progress for a project
 * - POST: Create or update checklist progress
 * - PUT: Update existing progress
 * - DELETE: Delete progress record
 */

import prisma from "../../../lib/prisma";
import { Prisma } from "@prisma/client";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

// GET - Fetch checklist progress for a project (both course and curriculum items)
async function handleGet(req, res) {
  const { projectId } = req.query;
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
    // OPTIMIZATION 2: Use select to reduce payload size
    // Only fetch fields that are actually needed for the response
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      select: {
        id: true,
        project_curriculums: {
          select: {
            curriculum: {
              select: {
                title: true,
                curriculum_checklist_items: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    itemOrder: true,
                    priority: true,
                    category: true
                  }
                },
                curriculum_courses: {
                  select: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                        course_checklist_items: {
                          select: {
                            id: true,
                            title: true,
                            description: true,
                            courseId: true,
                            participantOnly: true,
                            itemOrder: true,
                            priority: true,
                            category: true,
                            moduleId: true,
                            module: {
                              select: {
                                id: true,
                                title: true
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
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get all COURSE checklist item IDs
    const courseChecklistItemIds = [];
    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_courses.forEach(curriculumCourse => {
        curriculumCourse.course.course_checklist_items.forEach(item => {
          courseChecklistItemIds.push(item.id);
        });
      });
    });

    // Get all CURRICULUM checklist item IDs
    const curriculumChecklistItemIds = [];
    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_checklist_items.forEach(item => {
        curriculumChecklistItemIds.push(item.id);
      });
    });

    // OPTIMIZATION 3: Fetch progress records in parallel using Promise.all
    const [courseProgressRecords, curriculumProgressRecords] = await Promise.all([
      // Get progress records for COURSE checklist items
      prisma.project_course_checklist_progress.findMany({
        where: {
          projectId: parseInt(projectId),
          checklistItemId: { in: courseChecklistItemIds }
        }
      }),
      // Get progress records for CURRICULUM checklist items
      prisma.project_curriculum_checklist_progress.findMany({
        where: {
          projectId: parseInt(projectId),
          checklistItemId: { in: curriculumChecklistItemIds }
        }
      })
    ]);

    // Create progress maps for quick lookup
    const courseProgressMap = {};
    courseProgressRecords.forEach(progress => {
      courseProgressMap[progress.checklistItemId] = progress;
    });

    const curriculumProgressMap = {};
    curriculumProgressRecords.forEach(progress => {
      curriculumProgressMap[progress.checklistItemId] = progress;
    });

    // Get participant progress for participant-only items
    const participantOnlyItemIds = [];
    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_courses.forEach(curriculumCourse => {
        curriculumCourse.course.course_checklist_items.forEach(item => {
          if (item.participantOnly) {
            participantOnlyItemIds.push(item.id);
          }
        });
      });
    });

    // OPTIMIZATION 1: Batch participant count queries
    // Instead of N queries (one per participant-only item), do 2 queries total
    // Get active participant data for participant-only items
    const participantProgress = await prisma.project_participants_course_checklist_progress.findMany({
      where: {
        projectId: parseInt(projectId),
        checklistItemId: { in: participantOnlyItemIds },
        participant: { status: 'active' }
      }
    });

    // Create participant progress map for quick lookup
    const participantProgressMap = {};

    // STEP 1: Batch fetch all checklist items with their courseIds
    const checklistItemsWithCourses = participantOnlyItemIds.length > 0
      ? await prisma.course_checklist_items.findMany({
          where: { id: { in: participantOnlyItemIds } },
          select: { id: true, courseId: true }
        })
      : [];

    // Create item ID to course ID mapping
    const itemToCourseMap = {};
    checklistItemsWithCourses.forEach(item => {
      itemToCourseMap[item.id] = item.courseId;
    });

    // STEP 2: Get unique course IDs
    const uniqueCourseIds = [...new Set(checklistItemsWithCourses.map(item => item.courseId))];

    // STEP 3: Batch fetch participant counts for all courses in a single query
    // Using raw SQL for optimal performance with complex joins
    if (uniqueCourseIds.length > 0) {
      // Build the SQL query with proper Prisma.sql interpolation
      const courseParticipantCounts = await prisma.$queryRaw(
        Prisma.sql`
          SELECT DISTINCT
            e."courseId",
            COUNT(DISTINCT pp.id)::int as participant_count
          FROM events e
          LEFT JOIN event_groups eg ON eg."eventsId" = e.id
          LEFT JOIN group_participants gp ON gp."groupId" = eg."groupId"
          LEFT JOIN event_attendees ea ON ea."eventsId" = e.id
          LEFT JOIN project_participants pp ON (
            pp.id = gp."participantId" OR pp.id = ea."enrolleeId"
          ) AND pp.status = 'active' AND pp."projectId" = ${parseInt(projectId)}
          WHERE e."projectId" = ${parseInt(projectId)}
            AND e."courseId" = ANY(${uniqueCourseIds})
          GROUP BY e."courseId"
        `
      );

      // Create course participant count map
      const courseCountMap = {};
      courseParticipantCounts.forEach(row => {
        courseCountMap[row.courseId] = parseInt(row.participant_count) || 0;
      });

      // STEP 4: Map participant counts back to checklist items
      participantOnlyItemIds.forEach(itemId => {
        const courseId = itemToCourseMap[itemId];
        const participantCount = courseCountMap[courseId] || 0;

        participantProgressMap[itemId] = {
          completed: 0,
          total: participantCount
        };
      });
    }

    // Count completed participants for each item
    participantProgress.forEach(progress => {
      if (progress.completed && participantProgressMap[progress.checklistItemId]) {
        participantProgressMap[progress.checklistItemId].completed++;
      }
    });

    // Flatten all checklist items (CURRICULUM + COURSE items)
    const checklistItems = [];

    project.project_curriculums.forEach(projectCurriculum => {
      // Add CURRICULUM checklist items first
      projectCurriculum.curriculum.curriculum_checklist_items.forEach(item => {
        const progress = curriculumProgressMap[item.id] || null;

        checklistItems.push({
          ...item,
          curriculumName: projectCurriculum.curriculum.title,
          completed: progress?.completed || false,
          completedAt: progress?.completedAt || null,
          completedBy: progress?.completedBy || null,
          notes: progress?.notes || null,
          progressId: progress?.id || null,
          itemType: 'curriculum', // Flag to distinguish item type
          participantOnly: false
        });
      });

      // Then add COURSE checklist items
      projectCurriculum.curriculum.curriculum_courses.forEach(curriculumCourse => {
        curriculumCourse.course.course_checklist_items.forEach(item => {
          const progress = courseProgressMap[item.id] || null;
          const participantCompletion = participantProgressMap[item.id];

          // Determine completion status
          let isCompleted = progress?.completed || false;

          // Auto-complete participant-only items when all active participants complete
          if (item.participantOnly && participantCompletion) {
            const { completed, total } = participantCompletion;
            const allParticipantsCompleted = completed === total && total > 0;

            // Auto-update the main progress if all participants completed but main task isn't marked complete
            if (allParticipantsCompleted && !isCompleted) {
              // Update the main task progress
              prisma.project_course_checklist_progress.upsert({
                where: {
                  projectId_checklistItemId: {
                    projectId: parseInt(projectId),
                    checklistItemId: item.id
                  }
                },
                update: {
                  completed: true,
                  completedAt: new Date(),
                  completedBy: 'auto-system',
                  updatedAt: new Date()
                },
                create: {
                  projectId: parseInt(projectId),
                  checklistItemId: item.id,
                  completed: true,
                  completedAt: new Date(),
                  completedBy: 'auto-system',
                  createdBy: 'auto-system'
                }
              }).catch(error => console.error('Error auto-updating checklist item:', error));
            }

            isCompleted = allParticipantsCompleted;
          }

          checklistItems.push({
            ...item,
            courseName: curriculumCourse.course.title,
            curriculumName: projectCurriculum.curriculum.title,
            completed: isCompleted,
            completedAt: progress?.completedAt || null,
            completedBy: progress?.completedBy || null,
            notes: progress?.notes || null,
            progressId: progress?.id || null,
            itemType: 'course', // Flag to distinguish item type
            participantOnly: item.participantOnly || false,
            participantCompletionCount: participantCompletion || null
          });
        });
      });
    });

    return res.status(200).json(checklistItems);
  } catch (error) {
    console.error('Error fetching project checklist progress:', error);
    return res.status(500).json({ 
      message: 'Error fetching checklist progress',
      error: error.message 
    });
  }
}

// POST - Create or update checklist progress
async function handlePost(req, res) {
  const { projectId, checklistItemId, completed, notes, completedBy, itemType } = req.body;
  const { orgContext } = req;

  if (!projectId || !checklistItemId) {
    throw new ValidationError('Project ID and checklist item ID are required');
  }

  // Verify project ownership
  const projectOwnership = await scopedFindUnique(orgContext, 'projects', {
    where: { id: parseInt(projectId) }
  });

  if (!projectOwnership) {
    throw new NotFoundError('Project not found');
  }

  try {
    let progress;

    // Determine which table to update based on itemType
    if (itemType === 'curriculum') {
      // Update curriculum checklist progress
      progress = await prisma.project_curriculum_checklist_progress.upsert({
        where: {
          projectId_checklistItemId: {
            projectId: parseInt(projectId),
            checklistItemId: parseInt(checklistItemId)
          }
        },
        update: {
          completed: completed || false,
          completedAt: completed ? new Date() : null,
          notes: notes || null,
          completedBy: completedBy || null,
          updatedBy: completedBy || null,
          updatedAt: new Date()
        },
        create: {
          projectId: parseInt(projectId),
          checklistItemId: parseInt(checklistItemId),
          completed: completed || false,
          completedAt: completed ? new Date() : null,
          notes: notes || null,
          completedBy: completedBy || null,
          createdBy: completedBy || null
        },
        include: {
          checklistItem: true
        }
      });
    } else {
      // Default to course checklist progress (backward compatibility)
      progress = await prisma.project_course_checklist_progress.upsert({
        where: {
          projectId_checklistItemId: {
            projectId: parseInt(projectId),
            checklistItemId: parseInt(checklistItemId)
          }
        },
        update: {
          completed: completed || false,
          completedAt: completed ? new Date() : null,
          notes: notes || null,
          completedBy: completedBy || null,
          updatedAt: new Date()
        },
        create: {
          projectId: parseInt(projectId),
          checklistItemId: parseInt(checklistItemId),
          completed: completed || false,
          completedAt: completed ? new Date() : null,
          notes: notes || null,
          completedBy: completedBy || null,
          createdBy: completedBy || null
        },
        include: {
          checklistItem: {
            include: {
              module: true,
              course: true
            }
          }
        }
      });
    }

    return res.status(200).json({
      message: 'Checklist progress updated successfully',
      progress
    });
  } catch (error) {
    console.error('Error updating checklist progress:', error);
    return res.status(500).json({
      message: 'Error updating checklist progress',
      error: error.message
    });
  }
}

// PUT - Update existing progress
async function handlePut(req, res) {
  const { id } = req.query;
  const { completed, notes, completedBy } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Progress ID is required' });
  }

  try {
    const progress = await prisma.project_course_checklist_progress.update({
      where: { id: parseInt(id) },
      data: {
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        notes: notes || null,
        completedBy: completedBy || null,
        updatedAt: new Date()
      },
      include: {
        checklistItem: {
          include: {
            module: true,
            course: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Checklist progress updated successfully',
      progress
    });
  } catch (error) {
    console.error('Error updating checklist progress:', error);
    return res.status(500).json({ 
      message: 'Error updating checklist progress',
      error: error.message 
    });
  }
}

// DELETE - Delete progress record
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Progress ID is required' });
  }

  try {
    await prisma.project_course_checklist_progress.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      message: 'Checklist progress deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting checklist progress:', error);
    return res.status(500).json({
      message: 'Error deleting checklist progress',
      error: error.message
    });
  }
}

export default withOrgScope(asyncHandler(handler));