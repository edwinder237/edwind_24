import prisma from '../../../lib/prisma';

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

    // Flatten all checklist items from all courses in all curriculums
    const checklistItems = [];
    
    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_courses.forEach(curriculumCourse => {
        curriculumCourse.course.course_checklist_items.forEach(item => {
          const progress = progressMap[item.id] || null;
          checklistItems.push({
            ...item,
            courseName: curriculumCourse.course.title,
            curriculumName: projectCurriculum.curriculum.title,
            completed: progress?.completed || false,
            completedAt: progress?.completedAt || null,
            completedBy: progress?.completedBy || null,
            notes: progress?.notes || null,
            progressId: progress?.id || null
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