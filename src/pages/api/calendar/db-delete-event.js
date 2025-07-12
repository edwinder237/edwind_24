import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { eventId } = req.body;
    try {
      await prisma.events.delete({
        where: {
          id: eventId
        }
      });
      
  
      res.status(200).json("Event deleted and removed from database");
      console.log("Event deleted and removed from database");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  }

  
  
  
  
  
  
