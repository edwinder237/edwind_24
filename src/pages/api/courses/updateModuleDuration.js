import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  PUT: async (req, res) => {
    const { moduleId, customDuration } = req.body;

    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }

    // If customDuration is null or undefined, we're resetting to calculated duration
    const updateData = customDuration !== null && customDuration !== undefined
      ? { customDuration: parseInt(customDuration) }
      : { customDuration: null };

    // Update the module in the database
    const updatedModule = await prisma.module.update({
      where: { id: parseInt(moduleId) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: customDuration !== null && customDuration !== undefined
        ? 'Module duration updated successfully'
        : 'Module duration reset to calculated value',
      module: updatedModule
    });
  }
});
