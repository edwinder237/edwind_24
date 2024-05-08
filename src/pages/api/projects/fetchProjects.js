import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const projects = await prisma.projects.findMany({
      orderBy: {
        createdAt: 'desc', // 'asc' for ascending, 'desc' for descending
      },
      include:{
        user:true
      }
    });

    res.status(200).json({ projects });
    console.log("projects fetched successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
