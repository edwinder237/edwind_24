import prisma from "../../../lib/prisma";
import { withOrgScope } from "../../../lib/middleware/withOrgScope";
import { enforceResourceLimit } from "../../../lib/features/subscriptionService";
import { RESOURCES } from "../../../lib/features/featureAccess";

async function handler(req, res) {
  try {
    // Extract participant data from the request body
    const { projectId, newParticipant } = req.body;
    const { orgContext } = req;

    if (!projectId || !newParticipant || !newParticipant.participant) {
      return res.status(400).json({
        success: false,
        error: "Missing required data: projectId and participant information required"
      });
    }

    if (!orgContext || !orgContext.subOrganizationIds?.length) {
      return res.status(403).json({
        success: false,
        error: "Organization context required"
      });
    }

    const email = newParticipant.participant.email.toLowerCase().trim();
    const projectIdInt = parseInt(projectId);

    // Get the project to find its training recipient AND sub-organization
    // Also verify the project belongs to the user's accessible sub-organizations
    const project = await prisma.projects.findFirst({
      where: {
        id: projectIdInt,
        sub_organizationId: {
          in: orgContext.subOrganizationIds
        }
      },
      select: {
        trainingRecipientId: true,
        sub_organizationId: true
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
        message: "Cannot find the project or you don't have access to it"
      });
    }

    if (!project.trainingRecipientId) {
      return res.status(400).json({
        success: false,
        error: "Project has no training recipient",
        message: "Cannot create participant: project must be linked to a training recipient"
      });
    }

    // Check if participant already exists in THIS sub-organization (multi-tenant scoping)
    let participant = await prisma.participants.findFirst({
      where: {
        email,
        sub_organization: project.sub_organizationId
      }
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

    // Check participant limit before creating a new participant
    if (!participant) {
      const limitCheck = await enforceResourceLimit(orgContext.organizationId, RESOURCES.PARTICIPANTS);
      if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
    }

    // If participant doesn't exist in this sub-organization, create them
    if (!participant) {
      // Validate and set roleId
      let roleId = null;
      if (newParticipant.participant.roleId) {
        roleId = parseInt(newParticipant.participant.roleId);

        // Verify role exists AND belongs to the same sub-organization
        const roleExists = await prisma.sub_organization_participant_role.findFirst({
          where: {
            id: roleId,
            sub_organizationId: project.sub_organizationId
          }
        });

        if (!roleExists) {
          console.warn(`Role with ID ${roleId} not found in sub-organization, setting to null`);
          roleId = null;
        }
      }

      const participantData = {
        firstName: newParticipant.participant.firstName.trim(),
        lastName: newParticipant.participant.lastName.trim(),
        email: email,
        participantStatus: newParticipant.participant.participantStatus || "active",
        trainingRecipientId: project.trainingRecipientId,
        externalId: newParticipant.participant.externalId || null,
        roleId: roleId,
        sub_organization: project.sub_organizationId, // Use the project's sub-organization
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
          trainingRecipientId: project.trainingRecipientId,
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

    // Handle group assignment if specified
    if (newParticipant.group && newParticipant.group.trim() !== '') {
      try {
        const groupName = newParticipant.group.trim();

        // Check if the group exists
        let group = await prisma.groups.findFirst({
          where: {
            groupName: groupName,
            projectId: projectIdInt
          }
        });

        // If group doesn't exist, create it
        if (!group) {
          group = await prisma.groups.create({
            data: {
              groupName: groupName,
              projectId: projectIdInt,
              chipColor: "#1976d2" // Default color
            }
          });
        }

        // Add participant to group
        await prisma.group_participants.create({
          data: {
            groupId: group.id,
            participantId: projectParticipant.id
          }
        });

        console.log(`Participant ${participant.firstName} ${participant.lastName} assigned to group ${group.groupName}`);
      } catch (groupError) {
        console.error('Error assigning participant to group:', groupError);
        // Don't fail the entire operation if group assignment fails
        // The participant is still created successfully
      }
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
        message: "A participant with this email address already exists in this organization.",
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

export default withOrgScope(handler);
