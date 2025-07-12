import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Extract participant data from the request body
    const { projectId, newParticipant } = req.body;
    delete newParticipant.participant.id;

    // Create a new participant
    const participant = await prisma.participants.create({
      data: newParticipant.participant,
    });

    // Add the participant to the project_participants table for project ID

    const newProjectParticipant = await prisma.project_participants.create({
      data: {
        projectId,
        participantId: participant.id,
      },
      include: {
        participant: true,
        group: {
          include: {
            group: true,
          },
        },
      }
    });

    

    res.status(200).json({
      message: "Participant successfully added to database ",
      participant: participant,
      projectParticipant: newProjectParticipant,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  } finally {
    await prisma.$disconnect();
  }
}
