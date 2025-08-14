import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      title,
      description,
      activityType,
      duration,
      curriculumId,
      createdBy
    } = req.body;

    if (!title || !curriculumId) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and curriculum ID are required' 
      });
    }

    // Check if curriculum exists
    const curriculum = await prisma.curriculums.findUnique({
      where: { id: parseInt(curriculumId) }
    });

    if (!curriculum) {
      return res.status(404).json({ 
        success: false,
        message: 'Curriculum not found' 
      });
    }

    const supportActivity = await prisma.supportActivities.create({
      data: {
        title,
        description,
        activityType: activityType || 'General',
        duration: duration ? parseInt(duration) : null,
        curriculumId: parseInt(curriculumId),
        createdBy: createdBy || null
      },
      include: {
        curriculum: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Support activity created successfully',
      supportActivity
    });

    console.log(`Support activity "${supportActivity.title}" created for curriculum "${curriculum.title}"`);
  } catch (error) {
    console.error('Error creating support activity:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create support activity',
      error: error.message 
    });
  }
}