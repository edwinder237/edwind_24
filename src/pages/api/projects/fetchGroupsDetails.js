import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { projectId } = req;

  try {
    const groups = await prisma.groups.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        participants: {
          include:{
            participant:{
              include:{
                participant:{
                  select:{
                    firstName:true,
                    lastName:true,
                    email:true,

                  }
                }
              }
            }
          }
        }
      },
    });

    res.status(200).json(groups);
    console.log('GroupsDetails Fetched successfully')
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
