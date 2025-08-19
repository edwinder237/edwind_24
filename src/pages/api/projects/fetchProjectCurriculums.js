import prisma from "../../../lib/prisma";

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
                    id:true,
                    title:true,
                    curriculum_courses:{
                      select:{
                        course:{
                          select:{
                            id:true,
                            title:true,
                            modules:{
                              select:{
                                id:true,
                                customDuration:true,
                                activities:{
                                  select:{
                                    duration:true
                                  }
                                }
                              }
                            },
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

    res.status(200).json(projectCurriculums.project_curriculums);
  } catch (error) {
    console.error('Error fetching project curriculums:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
