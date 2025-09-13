import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await getParticipantChecklistItems(req, res);
      case 'PUT':
        return await updateParticipantChecklistProgress(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in participant checklist items API:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Fetch participant-only checklist items for a specific participant
async function getParticipantChecklistItems(req, res) {
  const { participantId } = req.query;

  if (!participantId) {
    return res.status(400).json({ error: 'Participant ID is required' });
  }

  try {
    const projectParticipant = await prisma.project_participants.findFirst({
      where: { participant: { id: participantId } },
      select: { id: true, projectId: true }
    });

    if (!projectParticipant) {
      return res.status(404).json({ error: 'Project participant not found' });
    }

    const [enrolledCourses, eventCourses] = await Promise.all([
      prisma.courses_enrollee_progress.findMany({
        where: { enrollee: { participant: { id: participantId } } },
        select: { courseId: true }
      }),
      prisma.events.findMany({
        where: {
          event_attendees: { some: { enrollee: { participant: { id: participantId } } } },
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

    res.status(200).json(Object.values(groupedItems));
  } catch (error) {
    console.error('Error fetching participant checklist items:', error);
    res.status(500).json({ error: 'Failed to fetch checklist items' });
  }
}

async function updateParticipantChecklistProgress(req, res) {
  const { participantId, checklistItemId, completed, notes } = req.body;

  if (!participantId || !checklistItemId || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'participantId, checklistItemId, and completed status are required' });
  }

  try {
    const projectParticipant = await prisma.project_participants.findFirst({
      where: { participant: { id: participantId } },
      select: { id: true, projectId: true }
    });

    if (!projectParticipant) {
      return res.status(404).json({ error: 'Project participant not found' });
    }

    const progressRecord = await prisma.project_participants_course_checklist_progress.upsert({
      where: {
        unique_participant_checklist_item: {
          projectId: projectParticipant.projectId,
          participantId: projectParticipant.id,
          checklistItemId: parseInt(checklistItemId)
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? participantId : null,
        notes: notes || null,
        updatedBy: participantId
      },
      create: {
        projectId: projectParticipant.projectId,
        participantId: projectParticipant.id,
        checklistItemId: parseInt(checklistItemId),
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? participantId : null,
        notes: notes || null,
        createdBy: participantId
      }
    });

    res.status(200).json({ success: true, progress: progressRecord });
  } catch (error) {
    console.error('Error updating participant checklist progress:', error);
    res.status(500).json({ error: 'Failed to update checklist progress' });
  }
}