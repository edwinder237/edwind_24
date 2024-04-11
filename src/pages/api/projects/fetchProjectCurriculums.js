import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const {projectId} =req.body;
      const projectCurriculums = await prisma.projects.findUnique({
        where:{
          id:projectId
        },
        select:{
          project_curriculums:{
           
              select:{
                curriculum:{
                  select:{
                    title:true,
                    curriculum_courses:{
                      select:{
                        course:{
                          select:{
                            id:true,
                            title:true,
                            course_roles:{
                              select:{
                                role:{
                                  select:{
                                    title:true
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              
            
          }
        }
            });

    res.status(200).json(projectCurriculums.project_curriculums
      );
    console.log("Project_curriculums fetched successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
