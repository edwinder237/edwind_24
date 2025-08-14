import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('DELETE /api/projects/remove-curriculum - req.body:', req.body);
    const { projectId, curriculumId } = req.body;
    console.log('Extracted parameters:', { projectId, curriculumId });

    if (!projectId || !curriculumId) {
      console.log('Missing parameters check failed:', { projectId, curriculumId });
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

    res.status(200).json({
      success: true,
      message: 'Curriculum removed from project successfully'
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