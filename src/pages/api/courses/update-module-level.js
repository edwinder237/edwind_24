import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { moduleId, level } = req.body;

    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }

    if (!level) {
      return res.status(400).json({ message: 'Level is required' });
    }

    // Validate level value
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ 
        message: 'Invalid level. Must be one of: Beginner, Intermediate, Advanced' 
      });
    }

    // Check if module exists
    const existingModule = await prisma.modules.findUnique({
      where: { id: parseInt(moduleId) }
    });

    if (!existingModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Update the module level
    const updatedModule = await prisma.modules.update({
      where: { id: parseInt(moduleId) },
      data: { 
        level: level,
        lastUpdated: new Date()
      },
      include: {
        activities: {
          orderBy: { ActivityOrder: 'asc' }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Module level updated to ${level}`,
      module: updatedModule
    });

  } catch (error) {
    console.error('Error updating module level:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update module level',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}