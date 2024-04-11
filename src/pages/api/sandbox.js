import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const { projectId, newParticipants } = req.body;

    const newProjectParticipant = await prisma.event_attendees.findMany({
      include: {
        enrollee: {
          select: {
            courses_enrollee_progress: {
              select: {
                completed: true,
              },
              where: {
                courseId: 1,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: "Participant successfully added to the database",
      participant: newProjectParticipant,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
}
