import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.body;
  console.log(id)
  try {
    const project = await prisma.projects.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        participants: {
          include: {
            courses_enrollee_progress: true,
          },
        },
        groups: true,
        events: {
          include: {
            course: {
              select: {
                id: true,
              },
            },
            event_attendees: {
              include: {
                enrollee: {
                  select: {
                    participant: true,
                  },
                },
              },
            },
            event_groups: {
              include: {
                groups: {
                  include: {
                    participants: {},
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ Project: null, error: `Project with ID ${id} not found` });
    }

    res.status(200).json({ project });
    console.log(`${project.title} project fetched successfully`);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: `Internal Server Error from fetch single project ${id}` });
  } finally {
    await prisma.$disconnect();
  }
}
