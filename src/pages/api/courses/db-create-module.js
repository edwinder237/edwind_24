import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { module } = req.body;
    delete module.activities;
    delete module.id;
    try {
       await prisma.modules.create({
        data: module
      });
      
  
      res.status(200).json("Module created and saved to database");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  }

  
  
  
  
  
  
