import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { editedModule, moduleId } = req.body;


  if (!moduleId || !editedModule) {
    return res.status(400).json({ error: 'Missing required fields: moduleId and editedModule' });
  }

  // Ensure moduleId is an integer
  const parsedModuleId = parseInt(moduleId);
  if (isNaN(parsedModuleId)) {
    return res.status(400).json({ error: 'Invalid moduleId: must be a number' });
  }

  // Remove fields that shouldn't be updated directly or don't exist in the schema
  const updateData = { ...editedModule };
  delete updateData.activities;
  delete updateData.id; // Remove id from update data
  delete updateData.numActivities; // This is calculated, not stored
  delete updateData.version; // This doesn't exist in modules schema
  delete updateData.importance; // This doesn't exist in modules schema  
  delete updateData.rating; // This doesn't exist in modules schema
  delete updateData.learningObjectives; // This doesn't exist in modules schema
  delete updateData.isEditing; // UI state, not stored


  try {
    // First check if the module exists
    const existingModule = await prisma.modules.findUnique({
      where: { id: parsedModuleId }
    });
    if (!existingModule) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
        moduleId: parsedModuleId
      });
    }

    const updatedModule = await prisma.modules.update({
      where: {
        id: parsedModuleId
      },
      data: updateData
    });

    res.status(200).json({ 
      success: true, 
      message: "Module updated and saved to database",
      module: updatedModule
    });
  } catch (error) {
    console.error('Error updating module:', error);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    res.status(500).json({ 
      success: false,
      error: "Failed to update module",
      details: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}
