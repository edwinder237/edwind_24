import prisma from '../../../lib/prisma';
import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, name, description, difficulty, estimatedDuration, selectedCourses } = req.body;

    if (!id || !name || !selectedCourses || selectedCourses.length === 0) {
      return res.status(400).json({ 
        message: 'ID, name and at least one course are required' 
      });
    }

    const curriculumId = parseInt(id);

    // Update curriculum basic info
    const updatedCurriculum = await prisma.curriculums.update({
      where: { id: curriculumId },
      data: {
        title: name,
        description: description || null,
        updatedAt: new Date()
      }
    });

    // Delete existing course relationships
    await prisma.curriculum_courses.deleteMany({
      where: { curriculumId }
    });

    // Create new course relationships
    const curriculumCourses = await Promise.all(
      selectedCourses.map(courseId =>
        prisma.curriculum_courses.create({
          data: {
            curriculumId,
            courseId: parseInt(courseId)
          }
        })
      )
    );

    // Fetch the complete updated curriculum with courses
    const fullCurriculum = await prisma.curriculums.findUnique({
      where: { id: curriculumId },
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                summary: true,
                level: true,
                courseStatus: true,
                modules: {
                  include: {
                    activities: {
                      select: {
                        duration: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const formattedCurriculum = {
      ...fullCurriculum,
      difficulty,
      estimatedDuration: parseInt(estimatedDuration) || null,
      courses: fullCurriculum.curriculum_courses.map(cc => cc.course),
      courseCount: fullCurriculum.curriculum_courses.length,
      totalDuration: fullCurriculum.curriculum_courses.reduce((sum, cc) => {
        return sum + calculateCourseDurationFromModules(cc.course.modules);
      }, 0)
    };

    res.status(200).json({
      success: true,
      message: 'Curriculum updated successfully',
      curriculum: formattedCurriculum
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