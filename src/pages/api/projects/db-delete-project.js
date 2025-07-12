import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { projectCUID } = req.body;
  try {
    await prisma.projects.delete({
      where: {
        id: projectCUID,
      },
    });

    res.status(200).json("Project removed from database");
    console.log("Project removed from database");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
