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

    // Use a transaction for atomicity and better performance
    const result = await prisma.$transaction(async (tx) => {
      // Check if the relationship exists and delete it in one query
      const deletedRelation = await tx.project_curriculums.deleteMany({
        where: {
          projectId: parseInt(projectId),
          curriculumId: parseInt(curriculumId)
        }
      });

      if (deletedRelation.count === 0) {
        throw new Error('Curriculum is not associated with this project');
      }

      // Remove the curriculum from all groups in this project (single optimized query)
      await tx.group_curriculums.deleteMany({
        where: {
          curriculumId: parseInt(curriculumId),
          group: {
            projectId: parseInt(projectId)
          }
        }
      });

      return deletedRelation;
    });

    if (!result || result.count === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curriculum is not associated with this project' 
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