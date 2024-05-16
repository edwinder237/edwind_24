import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const newGroup = await prisma.project_curriculums.create ({
      data: {
        projectId: 3, // Replace with the actual project ID
        curriculumId: 1, // Replace with the actual curriculum ID
        // Optionally, add more fields here as needed
      },
    });



    res.status(200).json({
      message: "sandbox success",
      data:  newGroup
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
