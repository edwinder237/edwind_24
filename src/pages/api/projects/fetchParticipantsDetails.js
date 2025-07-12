import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { projectId } = req;

  try {
    const projectParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        participant: true,
        group: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        id: 'desc', // or 'asc' for ascending order
      },
    });

    res.status(200).json(projectParticipants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
