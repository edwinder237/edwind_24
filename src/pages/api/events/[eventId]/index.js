import prisma from "../../../../lib/prisma";
import { createHandler } from '../../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
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
  }
});