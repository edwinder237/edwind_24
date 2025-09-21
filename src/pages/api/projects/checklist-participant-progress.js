import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      default:
        res.setHeader('Allow', ['GET']);
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

// GET - Fetch all participants' progress for a specific checklist item
async function handleGet(req, res) {
  const { projectId, checklistItemId } = req.query;

  if (!projectId || !checklistItemId) {
    return res.status(400).json({ message: 'Project ID and Checklist Item ID are required' });
  }

  try {
    // Fetch participant and progress data in parallel
    const [participants, progressRecords] = await Promise.all([
      // Get all participants (including removed ones for tracking)
      prisma.project_participants.findMany({
        where: { projectId: parseInt(projectId) },
        include: {
          participant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              trainingRecipientId: true,
              roleId: true,
              role: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      }),
      // Get progress records for this checklist item
      prisma.project_participants_course_checklist_progress.findMany({
        where: {
          projectId: parseInt(projectId),
          checklistItemId: parseInt(checklistItemId)
        }
      })
    ]);

    // Create progress lookup map
    const progressMap = new Map(
      progressRecords.map(progress => [progress.participantId, progress])
    );

    // Transform participant data with progress information
    const participantProgress = participants.map(participant => {
      const progress = progressMap.get(participant.id);
      const { participant: userData } = participant;
      
      return {
        participantId: participant.id,
        trainingRecipientId: userData.trainingRecipientId,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: userData.role?.title || 'Participant',
        status: participant.status,
        isActive: participant.status === 'active',
        completed: progress?.completed || false,
        completedAt: progress?.completedAt || null,
        notes: progress?.notes || null
      };
    });

    // Calculate summary statistics (completion rate based on active participants only)
    const activeParticipants = participantProgress.filter(p => p.isActive);
    const removedParticipants = participantProgress.filter(p => !p.isActive);
    const activeCompleted = activeParticipants.filter(p => p.completed);
    
    const summary = {
      total: participantProgress.length,
      active: activeParticipants.length,
      removed: removedParticipants.length,
      completed: activeCompleted.length,
      pending: activeParticipants.length - activeCompleted.length,
      completionRate: activeParticipants.length > 0 
        ? Math.round((activeCompleted.length / activeParticipants.length) * 100)
        : 0
    };

    return res.status(200).json({
      summary,
      participants: participantProgress
    });
  } catch (error) {
    console.error('Error fetching participant checklist progress:', error);
    return res.status(500).json({ 
      message: 'Error fetching participant progress',
      error: error.message 
    });
  }
}