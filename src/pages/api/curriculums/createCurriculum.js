import prisma from '../../../lib/prisma';
import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, description, difficulty, estimatedDuration, selectedCourses } = req.body;

    if (!name || !selectedCourses || selectedCourses.length === 0) {
      return res.status(400).json({ 
        message: 'Name and at least one course are required' 
      });
    }

    const curriculum = await prisma.curriculums.create({
      data: {
        title: name,
        description: description || null,
      }
    });

    const curriculumCourses = await Promise.all(
      selectedCourses.map(courseId =>
        prisma.curriculum_courses.create({
          data: {
            curriculumId: curriculum.id,
            courseId: parseInt(courseId)
          }
        })
      )
    );

    const fullCurriculum = await prisma.curriculums.findUnique({
      where: { id: curriculum.id },
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                summary: true,
                level: true,
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

    res.status(201).json({
      success: true,
      message: 'Curriculum created successfully',
      curriculum: {
        ...fullCurriculum,
        difficulty,
        estimatedDuration: parseInt(estimatedDuration) || null,
        courses: fullCurriculum.curriculum_courses.map(cc => cc.course)
      }
    });

  } catch (error) {
    console.error('Error creating curriculum:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create curriculum',
      error: error.message 
    });
  }
}