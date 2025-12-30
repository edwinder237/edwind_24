import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      courseId,
      title,
      description,
      maxScore = 100,
      passingScore = 70,
      isActive = true,
      assessmentOrder,
      allowRetakes = true,
      maxAttempts,
      scoreStrategy = 'latest',
      createdBy = 'system' // Should get from session/auth
    } = req.body;

    // Validation
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Assessment title is required'
      });
    }

    if (passingScore > maxScore) {
      return res.status(400).json({
        success: false,
        message: 'Passing score cannot be greater than max score'
      });
    }

    // Validate scoreStrategy
    const validStrategies = ['latest', 'highest', 'average', 'first'];
    if (!validStrategies.includes(scoreStrategy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid score strategy. Must be one of: ${validStrategies.join(', ')}`
      });
    }

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create the assessment
    const assessment = await prisma.course_assessments.create({
      data: {
        courseId: parseInt(courseId),
        title,
        description: description || null,
        maxScore: parseFloat(maxScore),
        passingScore: parseFloat(passingScore),
        isActive,
        assessmentOrder: assessmentOrder ? parseInt(assessmentOrder) : null,
        allowRetakes,
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
        scoreStrategy,
        createdBy
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            cuid: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment
    });

  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment',
      error: error.message
    });
  }
}
