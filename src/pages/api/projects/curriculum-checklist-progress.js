import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
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

// GET - Fetch curriculum checklist progress for a project
async function handleGet(req, res) {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ message: 'Project ID is required' });
  }

  try {
    // Get project with its curriculums
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        project_curriculums: {
          include: {
            curriculum: {
              include: {
                curriculum_checklist_items: {
                  orderBy: [
                    { itemOrder: 'asc' },
                    { category: 'asc' },
                    { createdAt: 'asc' }
                  ]
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

    // Get all curriculum checklist item IDs
    const checklistItemIds = [];
    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_checklist_items.forEach(item => {
        checklistItemIds.push(item.id);
      });
    });

    // Get progress records
    const progressRecords = await prisma.project_curriculum_checklist_progress.findMany({
      where: {
        projectId: parseInt(projectId),
        checklistItemId: { in: checklistItemIds }
      }
    });

    // Create progress map
    const progressMap = {};
    progressRecords.forEach(progress => {
      progressMap[progress.checklistItemId] = progress;
    });

    // Build response with all checklist items and their progress
    const checklistItems = [];

    project.project_curriculums.forEach(projectCurriculum => {
      projectCurriculum.curriculum.curriculum_checklist_items.forEach(item => {
        const progress = progressMap[item.id] || null;

        checklistItems.push({
          ...item,
          curriculumName: projectCurriculum.curriculum.title,
          curriculumId: projectCurriculum.curriculum.id,
          completed: progress?.completed || false,
          completedAt: progress?.completedAt || null,
          completedBy: progress?.completedBy || null,
          notes: progress?.notes || null,
          progressId: progress?.id || null,
          itemType: 'curriculum' // Flag to distinguish from course items
        });
      });
    });

    return res.status(200).json(checklistItems);
  } catch (error) {
    console.error('Error fetching curriculum checklist progress:', error);
    return res.status(500).json({
      message: 'Error fetching checklist progress',
      error: error.message
    });
  }
}

// POST - Create or update curriculum checklist progress
async function handlePost(req, res) {
  const { projectId, checklistItemId, completed, notes, completedBy } = req.body;

  if (!projectId || !checklistItemId) {
    return res.status(400).json({
      message: 'Project ID and checklist item ID are required'
    });
  }

  try {
    // Use upsert to create or update progress
    const progress = await prisma.project_curriculum_checklist_progress.upsert({
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

    return res.status(200).json({
      message: 'Checklist progress updated successfully',
      progress
    });
  } catch (error) {
    console.error('Error updating curriculum checklist progress:', error);
    return res.status(500).json({
      message: 'Error updating checklist progress',
      error: error.message
    });
  }
}
