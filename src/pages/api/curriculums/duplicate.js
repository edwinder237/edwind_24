import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Curriculum ID is required' });
    }

    // Fetch the original curriculum with all related data
    const originalCurriculum = await prisma.curriculums.findUnique({
      where: { id: parseInt(id) },
      include: {
        curriculum_courses: {
          include: {
            course: true
          }
        },
        supportActivities: true
      }
    });

    if (!originalCurriculum) {
      return res.status(404).json({ success: false, message: 'Curriculum not found' });
    }

    // Create the duplicated curriculum
    const duplicatedCurriculum = await prisma.curriculums.create({
      data: {
        title: `${originalCurriculum.title} (Copy)`,
        description: originalCurriculum.description,
        // Don't copy createdAt/updatedAt - use defaults
      }
    });

    // Duplicate curriculum courses
    if (originalCurriculum.curriculum_courses.length > 0) {
      await prisma.curriculum_courses.createMany({
        data: originalCurriculum.curriculum_courses.map(cc => ({
          curriculumId: duplicatedCurriculum.id,
          courseId: cc.courseId
        }))
      });
    }

    // Duplicate support activities
    if (originalCurriculum.supportActivities.length > 0) {
      await prisma.supportActivities.createMany({
        data: originalCurriculum.supportActivities.map(sa => ({
          title: sa.title,
          description: sa.description,
          duration: sa.duration,
          materials: sa.materials,
          curriculumId: duplicatedCurriculum.id,
          // Don't copy createdAt/updatedAt - use defaults
        }))
      });
    }

    // Fetch the complete duplicated curriculum for response
    const completeDuplicatedCurriculum = await prisma.curriculums.findUnique({
      where: { id: duplicatedCurriculum.id },
      include: {
        curriculum_courses: {
          include: {
            course: true
          }
        },
        supportActivities: true,
        _count: {
          select: {
            curriculum_courses: true,
            supportActivities: true,
            project_curriculums: true
          }
        }
      }
    });

    // Format the response similar to fetchCurriculums
    const formattedCurriculum = {
      ...completeDuplicatedCurriculum,
      courseCount: completeDuplicatedCurriculum._count.curriculum_courses,
      supportActivitiesCount: completeDuplicatedCurriculum._count.supportActivities,
      projectCount: completeDuplicatedCurriculum._count.project_curriculums
    };

    res.status(200).json({ 
      success: true, 
      message: 'Curriculum duplicated successfully',
      curriculum: formattedCurriculum
    });

  } catch (error) {
    console.error('Duplicate curriculum error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to duplicate curriculum',
      error: error.message 
    });
  }
}