import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Extract participant data from the request body
    const { projectId, newParticipants } = req.body;

    const data = newParticipants.map((participant) => ({
      projectId: projectId,
      participantId: participant.id,
    }));

     await prisma.project_participants.createMany({
      data,
    });

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

    res.status(200).json({
      message: "Participants successfully added to the database",
      participants: allProjectParticipants,
    });
    console.error("Participants successfully added to the database");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
