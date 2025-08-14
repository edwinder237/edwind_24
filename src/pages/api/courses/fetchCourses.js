import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {


    const courses = await prisma.courses.findMany({
      include: {
        course_instructors: {
          include: {
            instructor: true,
          },
        },
        modules: {
          orderBy: {
            moduleOrder: 'asc',
          },
          include: {
            activities: {
              orderBy: {
                ActivityOrder: 'asc',
              },
            },
          },
        },
      },
    });

    // Debug: Log maxParticipants values
    console.log("Courses maxParticipants:", courses.map(course => ({ 
      id: course.id, 
      title: course.title, 
      maxParticipants: course.maxParticipants 
    })));

    res.status(200).json(courses );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
