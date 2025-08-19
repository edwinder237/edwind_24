import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const { selectedIds } = req.body;
    
    const deletedProjectParticipants =
      await prisma.project_participants.deleteMany({
        where: {
          id: {
            in: selectedIds,
          },
        },
      });

    res
      .status(200)
      .json(
        "Participants successfully deleted from the database ",deletedProjectParticipants,
        deletedProjectParticipants
      );
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  } finally {
    await prisma.$disconnect();
  }
}
