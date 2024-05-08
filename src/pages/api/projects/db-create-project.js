import { ConsoleSqlOutlined } from "@ant-design/icons";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { newProject } = req.body;
  //delete newProject.id;

  console.log(newProject);

  const randomProject = {
    cuid: newProject.cuid,
   // sub_organizationId: newProject.sub_organizationId,
   // createdBy: "user123", // Replace with the actual createdBy user ID
    title: newProject.title,
    summary: newProject.summary,
    duration: 30, // Replace with the actual duration
    tags: newProject.tags,
    projectType: newProject.projectType,
    projectCategory: "CategoryB",
    projectStatus: "In Progress",
    startDate: newProject.startDate,
    endDate: newProject.endDate,
    backgroundImg: "image_url.jpg",
    color: "#3498db",
    language: newProject.language,
    location: newProject.location,
    published: newProject.published,
    sub_organization: { connect: { id: newProject.sub_organizationId } },
    user: {connect: {id:newProject.createdBy}}
  };

  try {
    await prisma.projects.create({
      data: randomProject,
    });

    res.status(200).json("Project created and saved to database");
    console.log("Project created and saved to database");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
