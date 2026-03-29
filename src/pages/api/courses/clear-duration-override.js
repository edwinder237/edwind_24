import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { moduleId } = req.body;

    if (!moduleId) {
      return res.status(400).json({ error: 'Missing required field: moduleId' });
    }

    // Ensure moduleId is an integer
    const parsedModuleId = parseInt(moduleId);
    if (isNaN(parsedModuleId)) {
      return res.status(400).json({ error: 'Invalid moduleId: must be a number' });
    }

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

    // Clear the duration override by setting it to null
    const updatedModule = await prisma.modules.update({
      where: {
        id: parsedModuleId
      },
      data: {
        duration: null,
        customDuration: null
      }
    });

    res.status(200).json({
      success: true,
      message: "Duration override cleared successfully",
      module: updatedModule
    });
  }
});
