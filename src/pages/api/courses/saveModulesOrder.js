import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { newModulesOrder, courseId } = req.body;
  
    try {
      await Promise.all(newModulesOrder.map(async (module, index) => {
        await prisma.modules.update({
          where: {
            id: module.id,
            courseId: 1,
          },
          data: {
            moduleOrder:index,
          },
        });
      }));
  
      res.status(200).json("Modules updated and saved to database");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  }

  
  
  
  
  
  
