import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Curriculum ID is required' 
      });
    }

    const curriculumId = parseInt(id);

    await prisma.curriculum_courses.deleteMany({
      where: { curriculumId }
    });

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