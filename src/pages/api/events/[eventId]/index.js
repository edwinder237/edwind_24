import prisma from "lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { eventId:id } = req.query;
    const eventId = parseInt(id, 10);

    if (!eventId || Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Valid eventId is required" });
    }

    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            training_recipient: { select: { id: true, name: true } },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            summary: true,
            course_participant_roles: {
              select:{
                role:{
                  select:{
                    id:true
                  }
                }
              }
            }
          },
        },
        event_attendees: {
          include: {
            enrollee: {
              select: {
                id: true,
                group:{
                  include: {
                    group: { // now the actual groups table
                      select: {
                        id: true,
                        groupName: true,
                        chipColor: true,
                      },
                    },
                  },
                },
                participant: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role:{
                      select:{
                        id:true,
                        title:true
                      }
                    }
                    
                  },
                },
              },
            },
          },
        },
        event_groups: {
          include: {
            groups: {
              select: {
                id: true,
                groupName: true,
                chipColor: true,
              },
            },
          },
        },
        event_instructors: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({ success: true, event });
  } catch (error) {
    console.error("Error fetching event details:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: String(error?.message || error),
    });
  }
}