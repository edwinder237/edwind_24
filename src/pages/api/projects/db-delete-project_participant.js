import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const { participantId } = req.body;
    const deletedProjectParticipants =
      await prisma.project_participants.delete({
        where: {
          id: participantId,
        },
      });

    res
      .status(200)
      .json(
        "Participant successfully deleted from the database ",
        deletedProjectParticipants
      );
    console.log("Participant successfully deleted from the database ");
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  } finally {
    await prisma.$disconnect();
  }
}
