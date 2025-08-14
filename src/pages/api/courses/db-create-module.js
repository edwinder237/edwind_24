import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
    const { module } = req.body;
    
    try {
      // Create a clean module object for database insertion
      const moduleData = {
        title: module.title,
        summary: module.summary || "Sample Summary",
        content: module.content || "Sample Content",
        JSONContent: module.JSONContent || {},
        customDuration: module.duration || null,
        published: module.published !== undefined ? module.published : true,
        moduleStatus: module.moduleStatus || "active",
        backgroundImg: module.backgroundImg || null,
        courseId: parseInt(module.courseId),
        moduleOrder: module.moduleOrder || 1
      };

      const newModule = await prisma.modules.create({
        data: moduleData
      });
      
      res.status(200).json({
        success: true,
        message: "Module created and saved to database",
        module: newModule
      });
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ 
        success: false,
        error: "Internal Server Error",
        details: error.message 
      });
    }
  }

  
  
  
  
  
  
