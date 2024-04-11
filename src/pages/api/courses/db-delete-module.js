import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { moduleId } = req.body;
    try {
      await prisma.modules.delete({
        where: {
          id: moduleId
        }
      });
      
  
      res.status(200).json("Module deleted and removed from database");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  }

  
  
  
  
  
  
