import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { projectId } = req.body;
    const events = await prisma.events.findMany({
      where: {
        projectId: projectId,
      },
      
        include: {
          course: {
            include: {
              modules: {
                include: {
                  activities: {
                    orderBy: {
                      ActivityOrder: 'asc'
                    }
                  }
                },
                orderBy: {
                  moduleOrder: 'asc'
                }
              }
            }
          },
          supportActivity: {
            include: {
              curriculum: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
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
                select:{
                  id: true,
                  groupName: true,
                  chipColor: true,
                  projectId: true
                  // Don't include participants - they should come from event_attendees only
                }
              }
            }
          }
        },
      
    });

    res.status(200).json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
