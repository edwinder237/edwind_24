import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {


    const courses = await prisma.courses.findMany({
      include: {
        
          modules: {
            orderBy: {
              moduleOrder: 'asc' // Sorting modules by moduleOrder in ascending order
            },
            include: {
              activities: {
                orderBy: {
                  ActivityOrder: 'asc' // Sorting activities by ActivityOrder in ascending order
                }
              }
            }
          }
        }
    });

    res.status(200).json(courses );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
