import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { projectId } = req.body;

  try {
    const projectParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: parseInt(projectId),
        status: { not: "removed" } // Only fetch active participants
      },
      include: {
        participant: {
          include: {
            training_recipient: true, // Include training recipient info
            role: true, // Include role information
            toolAccesses: {
              where: {
                isActive: true // Only include active tool accesses
              },
              orderBy: {
                tool: 'asc' // Sort tools alphabetically
              }
            }
          }
        }
      },
      orderBy: {
        id: "desc", // or 'asc' for ascending order
      },
    });

    res.status(200).json(projectParticipants);
    console.log("Project participants fetched successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
