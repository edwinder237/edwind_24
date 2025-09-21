import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
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

// GET - Fetch checklist progress for a project
async function handleGet(req, res) {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ message: 'Project ID is required' });
  }

  try {
    // First, get project with its curriculums and courses
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        project_curriculums: {
          include: {
            curriculum: {
              include: {
                curriculum_courses: {
                  include: {
                    course: {
                      include: {
                        course_checklist_items: {
                          include: {
                            module: true
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

    // Get all checklist item IDs
    const checklistItemIds = [];
    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_courses.forEach(curriculumCourse => {
        curriculumCourse.course.course_checklist_items.forEach(item => {
          checklistItemIds.push(item.id);
        });
      });
    });

    // Get progress records for all checklist items
    const progressRecords = await prisma.project_course_checklist_progress.findMany({
      where: {
        projectId: parseInt(projectId),
        checklistItemId: { in: checklistItemIds }
      }
    });

    // Create a map for quick lookup
    const progressMap = {};
    progressRecords.forEach(progress => {
      progressMap[progress.checklistItemId] = progress;  
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

    // Get active participant data for participant-only items
    const [participantProgress, totalActiveParticipants] = await Promise.all([
      // Participant progress (only from active participants)
      prisma.project_participants_course_checklist_progress.findMany({
        where: {
          projectId: parseInt(projectId),
          checklistItemId: { in: participantOnlyItemIds },
          participant: { status: 'active' }
        }
      }),
      // Total active participants count
      prisma.project_participants.count({
        where: { 
          projectId: parseInt(projectId),
          status: 'active'
        }
      })
    ]);

    // Create participant progress map for quick lookup
    const participantProgressMap = {};
    
    // Initialize all participant-only items with default values
    participantOnlyItemIds.forEach(itemId => {
      participantProgressMap[itemId] = { 
        completed: 0, 
        total: totalActiveParticipants 
      };
    });
    
    // Count completed participants for each item
    participantProgress.forEach(progress => {
      if (progress.completed && participantProgressMap[progress.checklistItemId]) {
        participantProgressMap[progress.checklistItemId].completed++;
      }
    });

    // Flatten all checklist items from all courses in all curriculums
    const checklistItems = [];
    
    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_courses.forEach(curriculumCourse => {
        curriculumCourse.course.course_checklist_items.forEach(item => {
          const progress = progressMap[item.id] || null;
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
  const { projectId, checklistItemId, completed, notes, completedBy } = req.body;

  if (!projectId || !checklistItemId) {
    return res.status(400).json({ 
      message: 'Project ID and checklist item ID are required' 
    });
  }

  try {
    // Use upsert to create or update progress
    const progress = await prisma.project_course_checklist_progress.upsert({
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