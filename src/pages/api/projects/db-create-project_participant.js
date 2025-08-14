import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    // Extract participant data from the request body
    const { projectId, newParticipant } = req.body;

    if (!projectId || !newParticipant || !newParticipant.participant) {
      return res.status(400).json({
        success: false,
        error: "Missing required data: projectId and participant information required"
      });
    }

    const email = newParticipant.participant.email.toLowerCase().trim();
    const projectIdInt = parseInt(projectId);

    // Check if participant already exists in the system
    let participant = await prisma.participants.findUnique({
      where: { email }
    });

    // Check if participant is already enrolled in this project
    if (participant) {
      const existingEnrollment = await prisma.project_participants.findFirst({
        where: {
          projectId: projectIdInt,
          participantId: participant.id,
          status: { not: "removed" } // Only check for active enrollments
        }
      });

      if (existingEnrollment) {
        return res.status(409).json({
          success: false,
          error: "Participant already enrolled",
          message: `${participant.firstName} ${participant.lastName} is already enrolled in this project.`,
          participantExists: true
        });
      }
    }

    // If participant doesn't exist, create them
    if (!participant) {
      // First, get the project to find its training recipient
      const project = await prisma.projects.findUnique({
        where: { id: projectIdInt },
        select: { trainingRecipientId: true }
      });

      if (!project || !project.trainingRecipientId) {
        return res.status(400).json({
          success: false,
          error: "Project has no training recipient",
          message: "Cannot create participant: project must be linked to a training recipient"
        });
      }

      const participantData = {
        firstName: newParticipant.participant.firstName.trim(),
        lastName: newParticipant.participant.lastName.trim(),
        email: email,
        participantStatus: newParticipant.participant.participantStatus || "active",
        trainingRecipientId: project.trainingRecipientId,
        roleId: newParticipant.participant.roleId ? parseInt(newParticipant.participant.roleId) : null,
        sub_organization: 1, // Default sub-organization ID
        profilePrefs: newParticipant.participant.profilePrefs || {},
        credentials: newParticipant.participant.credentials || {}
      };

      participant = await prisma.participants.create({
        data: participantData,
      });
    }

    // Add the participant to the project (reactivate if previously removed)
    const existingProjectParticipant = await prisma.project_participants.findFirst({
      where: {
        projectId: projectIdInt,
        participantId: participant.id
      }
    });

    let projectParticipant;

    if (existingProjectParticipant) {
      // Reactivate existing enrollment
      projectParticipant = await prisma.project_participants.update({
        where: { id: existingProjectParticipant.id },
        data: { status: "active" },
        include: {
          participant: {
            include: {
              training_recipient: true,
              role: true
            }
          },
          group: {
            include: {
              group: true,
            },
          },
        }
      });
    } else {
      // Create new enrollment
      projectParticipant = await prisma.project_participants.create({
        data: {
          projectId: projectIdInt,
          participantId: participant.id,
          status: "active"
        },
        include: {
          participant: {
            include: {
              training_recipient: true,
              role: true
            }
          },
          group: {
            include: {
              group: true,
            },
          },
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `${participant.firstName} ${participant.lastName} has been successfully added to the project`,
      participant: participant,
      projectParticipant: projectParticipant,
      wasExisting: !!existingProjectParticipant
    });

  } catch (error) {
    console.error("Error creating participant:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: "Email already exists",
        message: "A participant with this email address already exists in the system.",
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred while adding the participant.",
      details: error.message
    });
  }
}
