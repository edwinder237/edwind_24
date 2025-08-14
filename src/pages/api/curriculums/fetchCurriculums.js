import prisma from '../../../lib/prisma';
import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const curriculums = await prisma.curriculums.findMany({
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
        },
        supportActivities: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            title: true,
            activityType: true,
            duration: true
          }
        },
        project_curriculums: {
          select: {
            id: true,
            project: {
              select: {
                id: true,
                title: true,
                projectStatus: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedCurriculums = curriculums.map(curriculum => ({
      ...curriculum,
      courses: curriculum.curriculum_courses.map(cc => ({
        ...cc.course,
        calculatedDuration: calculateCourseDurationFromModules(cc.course.modules)
      })),
      courseCount: curriculum.curriculum_courses.length,
      supportActivitiesCount: curriculum.supportActivities.length,
      projectCount: curriculum.project_curriculums.length,
      totalDuration: curriculum.curriculum_courses.reduce((sum, cc) => {
        return sum + calculateCourseDurationFromModules(cc.course.modules);
      }, 0),
      totalSupportDuration: curriculum.supportActivities.reduce((sum, activity) => {
        return sum + (activity.duration || 0);
      }, 0)
    }));

    res.status(200).json(formattedCurriculums);

  } catch (error) {
    console.error('Error fetching curriculums:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch curriculums',
      error: error.message 
    });
  }
}