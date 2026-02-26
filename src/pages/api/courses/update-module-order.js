import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

  } catch (error) {
    console.error('Error updating module order:', error);
    return res.status(500).json({ 
      message: 'Failed to update module order',
      error: error.message 
    });
  } finally {
  }
}