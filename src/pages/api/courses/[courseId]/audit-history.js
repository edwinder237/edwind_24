import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { courseId } = req.query;
    const {
      entityType,
      actionType,
      startDate,
      endDate,
      limit = '20',
      offset = '0',
    } = req.query;

    const parsedCourseId = parseInt(courseId);
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (isNaN(parsedCourseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID',
      });
    }

    // Get course info
    const course = await prisma.courses.findUnique({
      where: { id: parsedCourseId },
      select: {
        id: true,
        title: true,
        version: true,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Build filter conditions
    const whereConditions = {
      courseId: parsedCourseId,
    };

    if (entityType) {
      whereConditions.entityType = entityType;
    }

    if (actionType) {
      whereConditions.actionType = actionType;
    }

    if (startDate || endDate) {
      whereConditions.changedAt = {};
      if (startDate) {
        whereConditions.changedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereConditions.changedAt.lte = end;
      }
    }

    // Get total count for pagination
    const total = await prisma.course_audit_logs.count({
      where: whereConditions,
    });

    // Fetch audit logs
    const history = await prisma.course_audit_logs.findMany({
      where: whereConditions,
      orderBy: { changedAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset,
    });

    return res.status(200).json({
      success: true,
      course,
      history,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + history.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit history',
      error: error.message,
    });
  }
}
