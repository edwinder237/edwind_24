import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const {courseId} = req.body;
  if (!courseId) {
    return res.status(400).json({ error: "Missing courseId parameter" });
  }
  try {
    const enrolledNotCompleted = await prisma.courses_enrollee_progress.findMany({
      where: {
        courseId: courseId,
        completed:false
      },
      select:{
        course:{
          select:{
            title:true
          }
        },
        enrollee:{
          select:{
            participant:{
              select:{
                firstName:true,
                lastName:true,
                email:true,
                notes:true,
                roleId:true,
                credentials:true
              }
            }
          }
        }
      }
    });

    const enrollees = enrolledNotCompleted.map(i=>i.enrollee).map(i=>i.participant);
    

    res.status(200).json(enrollees  );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error " });
  }
}
