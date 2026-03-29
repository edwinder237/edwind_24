import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
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
  }
});