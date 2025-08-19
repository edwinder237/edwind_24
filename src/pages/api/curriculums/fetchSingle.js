import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { curriculumId } = req.body;

    if (!curriculumId) {
      return res.status(400).json({ 
        success: false,
        message: 'Curriculum ID is required' 
      });
    }

    const curriculum = await prisma.curriculums.findUnique({
      where: {
        id: parseInt(curriculumId)
      },
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                summary: true,
                level: true,
                courseCategory: true,
                CourseType: true,
                deliveryMethod: true,
                code: true,
                rating: true,
                backgroundImg: true,
                course_participant_roles: {
                  include: {
                    role: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                },
                modules: {
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    customDuration: true,
                    moduleOrder: true,
                    activities: {
                      select: {
                        id: true,
                        title: true,
                        duration: true,
                        activityType: true,
                        ActivityOrder: true
                      },
                      orderBy: {
                        ActivityOrder: 'asc'
                      }
                    },
                    module_objectives: {
                      select: {
                        id: true,
                        objective: true,
                        objectiveOrder: true
                      },
                      orderBy: {
                        objectiveOrder: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    moduleOrder: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            id: 'asc'
          }
        },
        supportActivities: {
          where: {
            isActive: true
          },
          orderBy: [
            { activityType: 'asc' },
            { title: 'asc' }
          ]
        },
        project_curriculums: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                projectStatus: true
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

    // Calculate some statistics
    const courseCount = curriculum.curriculum_courses?.length || 0;
    const supportActivitiesCount = curriculum.supportActivities?.length || 0;
    const projectCount = curriculum.project_curriculums?.length || 0;

    // Calculate total estimated duration from support activities
    const totalSupportDuration = curriculum.supportActivities?.reduce((total, activity) => {
      return total + (activity.duration || 0);
    }, 0) || 0;

    res.status(200).json({
      success: true,
      curriculum: {
        ...curriculum,
        statistics: {
          courseCount,
          supportActivitiesCount,
          projectCount,
          totalSupportDuration
        }
      }
    });

  } catch (error) {
    console.error('Error fetching curriculum:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch curriculum',
      error: error.message 
    });
  }
}