import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
    const { editedJSON,selectedModuleId } = req.body;
  
    try {
       await prisma.modules.update({
        where: {
          id: selectedModuleId, // Replace moduleId with the actual ID of the module you want to update
        },
        data: {
          JSONContent: editedJSON, // Replace newJsonContent with the updated JSON content
        },
      });
      
  
      res.status(200).json("JSON Content updated and saved to database");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
    }
  }

  
  
  
  
  
  
