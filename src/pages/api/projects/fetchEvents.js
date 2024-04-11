import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const { projectId } = req.body;
    const events = await prisma.events.findMany({
      where: {
        projectId: projectId,
      },
      
        include: {
          course: {
            select: {
              id: true,
            },
          },
          event_attendees: {
            include: {
              enrollee:{
                select:{
                  participant:true
                }
              }
            }
          },
          event_groups:{
            include:{
              groups:{
                include:{
                  participants:{
                    include:{
                      participant:true
                    }
                  }
                }
              }
            }
          }
        },
      
    });

    res.status(200).json({ events });
    console.log("events fetched successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
