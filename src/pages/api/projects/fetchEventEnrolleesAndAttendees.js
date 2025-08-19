import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { courseId,eventId } = req.body;
  if (!courseId) {
    return res.status(400).json({ error: "Missing courseId " });
  }
  if (!eventId) {
    return res.status(400).json({ error: "Missing eventId " });
  }
  try {
    const enrolledNotCompleted =
      await prisma.courses_enrollee_progress.findMany({
        where: {
          courseId: courseId,
          completed: false,
        },
        select: {
          course: {
            select: {
              title: true,
            },
          },
          enrollee: {
            select: {
              id:true,
              participant: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  notes: true,
                  roleId: true,
                  credentials: true,
                  derpartement:true
                },
              },
            },
          },
        },
      });

      const attendeeList = await prisma.event_attendees.findMany({
        where:{
          eventsId:eventId
        },
        select:{
          enrollee:{
            select:{
              id:true,
              participant:true
            }
          }
        }
      });

    // Extract enrollees from enrolledNotCompleted
    const enrollees = enrolledNotCompleted.map((i) => ({
      enrolleeId: i.enrollee.id,
      participant: i.enrollee.participant
    }));

    const event = {
      enrollees: enrollees,
      attendees: attendeeList
    };

    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error " });
  } finally {
    await prisma.$disconnect();
  }
}
