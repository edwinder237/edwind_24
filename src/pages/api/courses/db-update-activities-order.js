import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
    const { newActivitiesOrder, moduleId } = req.body;
  
    try {
      await Promise.all(newActivitiesOrder.map(async (module, index) => {
        await prisma.activities.update({
          where: {
            id: module.id,
            moduleId:parseInt(moduleId),
          },
          data: {
            ActivityOrder:index,
          },
        });
      }));
  
      res.status(200).json("Activities updated and saved to database");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
    }
  }

  
  
  
  
  
  
