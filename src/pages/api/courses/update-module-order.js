import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { modules, courseId } = req.body;

    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({ message: 'Modules array is required' });
    }

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Update each module's order in the database
    const updatePromises = modules.map((module, index) => {
      return prisma.modules.update({
        where: { id: module.id },
        data: { moduleOrder: index }
      });
    });

    await Promise.all(updatePromises);

    // Fetch the updated modules to return
    const updatedModules = await prisma.modules.findMany({
      where: { courseId: parseInt(courseId) },
      orderBy: { moduleOrder: 'asc' },
      include: {
        activities: {
          orderBy: { ActivityOrder: 'asc' }
        }
      }
    });

    return res.status(200).json({
      message: 'Module order updated successfully',
      modules: updatedModules
    });
  }
});
