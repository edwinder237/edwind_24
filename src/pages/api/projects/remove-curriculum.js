import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, curriculumId } = req.body;

    if (!projectId || !curriculumId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID and Curriculum ID are required' 
      });
    }

    // Check if the relationship exists
    const existingRelation = await prisma.project_curriculums.findFirst({
      where: {
        projectId: parseInt(projectId),
        curriculumId: parseInt(curriculumId)
      }
    });

    if (!existingRelation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curriculum is not associated with this project' 
      });
    }

    // Delete the relationship
    await prisma.project_curriculums.delete({
      where: {
        id: existingRelation.id
      }
    });

    // Also remove the curriculum from all groups in this project
    const projectGroups = await prisma.groups.findMany({
      where: { projectId: parseInt(projectId) },
      select: { id: true }
    });

    if (projectGroups.length > 0) {
      await prisma.group_curriculums.deleteMany({
        where: {
          groupId: { in: projectGroups.map(g => g.id) },
          curriculumId: parseInt(curriculumId)
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Curriculum removed from project and all groups successfully'
    });

  } catch (error) {
    console.error('Error removing curriculum from project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove curriculum from project',
      error: error.message 
    });
  }
}