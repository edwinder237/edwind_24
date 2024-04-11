import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { projectId } = req;

  try {
    const projectParticipants = await prisma.participants.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        id: "desc", // or 'asc' for ascending order
      },
    });

    res.status(200).json(projectParticipants);
    console.log("sub_organisation participant fetched successfuly");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
