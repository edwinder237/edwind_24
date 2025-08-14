import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, title, description } = req.body;

    if (!id || !title || !title.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'ID and title are required' 
      });
    }

    const curriculumId = parseInt(id);

    // Check if curriculum exists
    const existingCurriculum = await prisma.curriculums.findUnique({
      where: { id: curriculumId }
    });

    if (!existingCurriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    const updatedCurriculum = await prisma.curriculums.update({
      where: { id: curriculumId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Curriculum updated successfully',
      curriculum: updatedCurriculum
    });

  } catch (error) {
    console.error('Error updating curriculum:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update curriculum',
      error: error.message 
    });
  }
}