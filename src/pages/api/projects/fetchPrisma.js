import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // const projects = await prisma.projects.findMany();

    // const newParticipant = await prisma.participants.findMany();

    //const projectParticipantEntry = await prisma.project_participants.create({
     // data: {
     //  projectId:1,
      // participantId: '6de9d633-db1e-4761-aa95-7229666683ac',
     // },
    // });

    const projects = await prisma.projects.findMany({
 //     where: {
   //     id: 1,
    //  },
      select: {
        id: true,
        title: true,
        summary: true,
        duration: true,
        projectType: true,
        projectCategory: true,
        projectStatus: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        lastUpdated: true,
        updatedby: true,
        createdBy: true,
        published: true,
        tags: true,
        ownerId: true,
        backgroundImg: true,
        color: true,
        groups: true,
        events:true,
        participants: true
            
          
        
      },
    });

    const participantsInProject1 = await prisma.project_participants.findMany({
      where: {
        projectId: 1,
      },
      include: {
        participant: true,
      },
    });

    res.status(200).json({ projects:projects,part:participantsInProject1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
