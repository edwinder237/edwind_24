import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const projects = await prisma.projects.findMany({
      orderBy: {
        createdAt: 'desc', // 'asc' for ascending, 'desc' for descending
      },
      include:{
        user:true,
        training_recipient:true,
        project_settings: true,
        sub_organization: true,
        project_instructors: {
          include: {
            instructor: true
          }
        }
      }
    });

    res.status(200).json({ projects });
    console.log("projects fetched successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
