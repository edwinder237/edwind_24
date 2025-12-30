import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { curriculumId } = req.query;

    if (!curriculumId) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum ID is required'
      });
    }

    // Get curriculum with its courses
    const curriculum = await prisma.curriculums.findUnique({
      where: { id: parseInt(curriculumId) },
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                cuid: true
              }
            }
          }
        }
      }
    });

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Get all course IDs from the curriculum
    const courseIds = curriculum.curriculum_courses.map(cc => cc.courseId);

    if (courseIds.length === 0) {
      return res.status(200).json({
        success: true,
        assessmentsByCourse: [],
        totalAssessments: 0
      });
    }

    // Fetch all assessments for these courses
    const assessments = await prisma.course_assessments.findMany({
      where: {
        courseId: {
          in: courseIds
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            cuid: true
          }
        },
        curriculum_overrides: {
          where: {
            curriculumId: parseInt(curriculumId)
          }
        }
      },
      orderBy: [
        { courseId: 'asc' },
        { assessmentOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Group assessments by course and add override status
    const assessmentsByCourse = {};

    curriculum.curriculum_courses.forEach(cc => {
      assessmentsByCourse[cc.courseId] = {
        courseId: cc.courseId,
        courseTitle: cc.course.title,
        courseCuid: cc.course.cuid,
        assessments: []
      };
    });

    assessments.forEach(assessment => {
      const override = assessment.curriculum_overrides.length > 0
        ? assessment.curriculum_overrides[0]
        : null;

      const assessmentData = {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        maxScore: assessment.maxScore,
        passingScore: assessment.passingScore,
        baseIsActive: assessment.isActive,
        allowRetakes: assessment.allowRetakes,
        maxAttempts: assessment.maxAttempts,
        scoreStrategy: assessment.scoreStrategy,
        assessmentOrder: assessment.assessmentOrder,
        // Override information
        hasOverride: override !== null,
        overrideIsActive: override ? override.isActive : null,
        overrideId: override ? override.id : null,
        overrideCreatedAt: override ? override.createdAt : null,
        overrideUpdatedAt: override ? override.updatedAt : null,
        // Effective status (override takes precedence)
        effectiveIsActive: override !== null ? override.isActive : assessment.isActive,
        overrideStatus: override === null ? 'none' : (override.isActive ? 'enabled' : 'disabled')
      };

      if (assessmentsByCourse[assessment.courseId]) {
        assessmentsByCourse[assessment.courseId].assessments.push(assessmentData);
      }
    });

    // Convert to array and sort by course title
    const assessmentsByCourseArray = Object.values(assessmentsByCourse).sort((a, b) =>
      a.courseTitle.localeCompare(b.courseTitle)
    );

    res.status(200).json({
      success: true,
      curriculumId: parseInt(curriculumId),
      curriculumTitle: curriculum.title,
      assessmentsByCourse: assessmentsByCourseArray,
      totalAssessments: assessments.length,
      totalCourses: courseIds.length
    });

  } catch (error) {
    console.error('Error fetching curriculum assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch curriculum assessments',
      error: error.message
    });
  }
}
