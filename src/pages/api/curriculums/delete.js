import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Curriculum ID is required' 
      });
    }

    const curriculumId = parseInt(id);

    // Check if curriculum exists
    const existingCurriculum = await prisma.curriculums.findUnique({
      where: { id: curriculumId },
      include: {
        project_curriculums: true,
        supportActivities: true
      }
    });

    if (!existingCurriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Delete related records first (cascade should handle this, but being explicit)
    await prisma.curriculum_courses.deleteMany({
      where: { curriculumId }
    });

    await prisma.supportActivities.deleteMany({
      where: { curriculumId }
    });

    await prisma.project_curriculums.deleteMany({
      where: { curriculumId }
    });

    // Delete the curriculum
    await prisma.curriculums.delete({
      where: { id: curriculumId }
    });

    res.status(200).json({
      success: true,
      message: 'Curriculum deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting curriculum:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete curriculum',
      error: error.message 
    });
  }
}