import prisma from '../../../lib/prisma';
import { RESOURCES } from '../../../lib/features/featureAccess';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract participant data from the request body
    const { projectId, newParticipants } = req.body;

    // Get the project to find its training recipient
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { trainingRecipientId: true }
    });

    if (!project || !project.trainingRecipientId) {
      return res.status(400).json({
        success: false,
        error: "Project has no training recipient",
        message: "Cannot add participants: project must be linked to a training recipient"
      });
    }

    const participantIds = newParticipants.map(p => p.id);

    // Check for existing enrollments (both active and inactive)
    const existingEnrollments = await prisma.project_participants.findMany({
      where: {
        projectId: projectId,
        participantId: { in: participantIds }
      }
    });

    const existingParticipantIds = existingEnrollments.map(e => e.participantId);
    const toReactivate = existingEnrollments.filter(e => e.status !== 'active');
    const toCreate = newParticipants.filter(p => !existingParticipantIds.includes(p.id));

    // Check participant limit before creating new enrollments
    if (toCreate.length > 0) {
      // Get organization from project's sub-organization
      const projectWithOrg = await prisma.projects.findUnique({
        where: { id: projectId },
        select: {
          sub_organization: {
            select: {
              organizationId: true
            }
          }
        }
      });

      if (projectWithOrg?.sub_organization?.organizationId) {
        const limitCheck = await enforceResourceLimit(
          projectWithOrg.sub_organization.organizationId,
          RESOURCES.PARTICIPANTS,
          toCreate.length
        );
        if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
      }
    }

    let reactivatedCount = 0;
    let createdCount = 0;

    // Reactivate inactive enrollments
    if (toReactivate.length > 0) {
      for (const enrollment of toReactivate) {
        await prisma.project_participants.update({
          where: { id: enrollment.id },
          data: {
            status: 'active',
            trainingRecipientId: project.trainingRecipientId // Update TR on reactivation
          }
        });
      }
      reactivatedCount = toReactivate.length;
    }

    // Create new enrollments
    if (toCreate.length > 0) {
      const data = toCreate.map((participant) => ({
        projectId: projectId,
        participantId: participant.id,
        trainingRecipientId: project.trainingRecipientId, // Set TR on enrollment
        status: 'active',
      }));

      const result = await prisma.project_participants.createMany({
        data,
        skipDuplicates: true, // Extra safety
      });

      createdCount = result.count;
    }

    // Fetch all project participants after creating new ones
    const allProjectParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        participant: {
          include: {
            training_recipient: true
          }
        },
        group: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        id: "desc", // or 'asc' for ascending order
      },
    });

    // Build success message
    let message = '';
    if (createdCount > 0 && reactivatedCount > 0) {
      message = `Successfully added ${createdCount} new participant(s) and reactivated ${reactivatedCount} previously inactive participant(s)`;
    } else if (createdCount > 0) {
      message = `Successfully added ${createdCount} new participant(s)`;
    } else if (reactivatedCount > 0) {
      message = `Successfully reactivated ${reactivatedCount} previously inactive participant(s)`;
    } else {
      message = 'All selected participants are already actively enrolled in this project';
    }

    res.status(200).json({
      message,
      participants: allProjectParticipants,
      stats: {
        created: createdCount,
        reactivated: reactivatedCount,
        total: createdCount + reactivatedCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
