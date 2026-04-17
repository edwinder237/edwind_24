import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { NotFoundError, ValidationError } from '../../../lib/errors/index.js';

export default createHandler({
  POST: async (req, res) => {
    const { participantId } = req.body;

    if (!participantId) {
      throw new ValidationError('Participant ID is required');
    }

    const enrolleeId = parseInt(participantId);

    // Verify the project_participant exists and belongs to a project in the user's org
    const projectParticipant = await prisma.project_participants.findUnique({
      where: { id: enrolleeId },
      include: { project: { select: { sub_organizationId: true } } }
    });

    if (!projectParticipant || !req.orgContext.subOrganizationIds.includes(projectParticipant.project.sub_organizationId)) {
      throw new NotFoundError('Participant not found');
    }

    // Remove from groups, events, and mark as removed — all atomically
    const [deletedGroups, deletedAttendees, updatedProjectParticipant] = await prisma.$transaction([
      prisma.group_participants.deleteMany({
        where: { participantId: enrolleeId }
      }),
      prisma.event_attendees.deleteMany({
        where: { enrolleeId: enrolleeId }
      }),
      prisma.project_participants.update({
        where: { id: enrolleeId },
        data: { status: 'removed' }
      })
    ]);

    res.status(200).json({
      message: 'Participant successfully marked as removed',
      participant: updatedProjectParticipant,
      groupMembershipsRemoved: deletedGroups.count,
      eventAttendeesRemoved: deletedAttendees.count
    });
  }
});
