import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getParticipantChecklistItems(req, res);
      case 'PUT':
        return await updateParticipantChecklistProgress(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
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

// GET - Fetch participant-only checklist items for a specific participant
async function getParticipantChecklistItems(req, res) {
  const { participantId } = req.query;

  if (!participantId) {
    return res.status(400).json({ message: 'Participant ID is required' });
  }

  try {
    const projectParticipant = await prisma.project_participants.findFirst({
      where: { participant: { id: String(participantId) } },
      select: { id: true, projectId: true }
    });

    if (!projectParticipant) {
      return res.status(404).json({ message: 'Project participant not found' });
    }

    const [enrolledCourses, eventCourses] = await Promise.all([
      prisma.courses_enrollee_progress.findMany({
        where: { enrollee: { participant: { id: String(participantId) } } },
        select: { courseId: true }
      }),
      prisma.events.findMany({
        where: {
          event_attendees: { some: { enrollee: { participant: { id: String(participantId) } } } },
          courseId: { not: null }
        },
        select: { courseId: true }
      })
    ]);

    const courseIds = [...new Set([
      ...enrolledCourses.map(ec => ec.courseId),
      ...eventCourses.map(ec => ec.courseId)
    ])];

    if (courseIds.length === 0) {
      return res.status(200).json([]);
    }

    const checklistItems = await prisma.course_checklist_items.findMany({
      where: {
        courseId: { in: courseIds },
        participantOnly: true
      },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        participant_progress: {
          where: {
            participantId: projectParticipant.id,
            projectId: projectParticipant.projectId
          },
          select: { id: true, completed: true, completedAt: true, completedBy: true, notes: true }
        }
      },
      orderBy: [
        { course: { title: 'asc' } },
        { category: 'asc' },
        { itemOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const groupedItems = checklistItems.reduce((acc, item) => {
      const courseTitle = item.course.title;
      if (!acc[courseTitle]) {
        acc[courseTitle] = {
          courseId: item.course.id,
          courseTitle,
          items: []
        };
      }
      
      const progress = item.participant_progress[0];
      acc[courseTitle].items.push({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        moduleId: item.moduleId,
        itemOrder: item.itemOrder,
        participantOnly: item.participantOnly,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        module: item.module,
        completed: progress?.completed || false,
        completedAt: progress?.completedAt,
        completedBy: progress?.completedBy,
        notes: progress?.notes,
        progressId: progress?.id
      });
      return acc;
    }, {});

    return res.status(200).json(Object.values(groupedItems));
  } catch (error) {
    console.error('Error fetching participant checklist items:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch checklist items',
      error: error.message 
    });
  }
}

async function updateParticipantChecklistProgress(req, res) {
  const { participantId, checklistItemId, completed, notes } = req.body;

  if (!participantId || !checklistItemId || typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'participantId, checklistItemId, and completed status are required' });
  }

  try {
    // participantId here is actually the project_participants.id (int), not participants.id (string)
    const projectParticipant = await prisma.project_participants.findUnique({
      where: { id: parseInt(participantId) },
      select: { id: true, projectId: true }
    });

    if (!projectParticipant) {
      return res.status(404).json({ message: 'Project participant not found' });
    }

    const progressRecord = await prisma.project_participants_course_checklist_progress.upsert({
      where: {
        unique_participant_checklist_item: {
          projectId: projectParticipant.projectId,
          participantId: parseInt(participantId),
          checklistItemId: parseInt(checklistItemId)
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? String(participantId) : null,
        notes: notes || null,
        updatedBy: String(participantId)
      },
      create: {
        projectId: projectParticipant.projectId,
        participantId: parseInt(participantId),
        checklistItemId: parseInt(checklistItemId),
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? String(participantId) : null,
        notes: notes || null,
        createdBy: String(participantId)
      }
    });

    // Check if all participants have completed this task for auto-completion
    if (completed) {
      const checklistItem = await prisma.course_checklist_items.findUnique({
        where: { id: parseInt(checklistItemId) },
        select: { participantOnly: true }
      });

      if (checklistItem?.participantOnly) {
        // Count total participants and completed participants
        const [totalParticipants, completedParticipants] = await Promise.all([
          prisma.project_participants.count({
            where: { projectId: projectParticipant.projectId }
          }),
          prisma.project_participants_course_checklist_progress.count({
            where: {
              projectId: projectParticipant.projectId,
              checklistItemId: parseInt(checklistItemId),
              completed: true
            }
          })
        ]);

        // If all participants completed, auto-complete the main task
        if (completedParticipants === totalParticipants) {
          await prisma.project_course_checklist_progress.upsert({
            where: {
              projectId_checklistItemId: {
                projectId: projectParticipant.projectId,
                checklistItemId: parseInt(checklistItemId)
              }
            },
            update: {
              completed: true,
              completedAt: new Date(),
              completedBy: 'auto-system',
              updatedAt: new Date()
            },
            create: {
              projectId: projectParticipant.projectId,
              checklistItemId: parseInt(checklistItemId),
              completed: true,
              completedAt: new Date(),
              completedBy: 'auto-system',
              createdBy: 'auto-system'
            }
          });
        }
      }
    }

    return res.status(200).json({ success: true, progress: progressRecord });
  } catch (error) {
    console.error('Error updating participant checklist progress:', error);
    return res.status(500).json({ 
      message: 'Failed to update checklist progress',
      error: error.message 
    });
  }
}