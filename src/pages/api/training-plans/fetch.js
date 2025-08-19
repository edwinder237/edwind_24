import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { curriculumId, projectId, id } = req.query;

    let where = {};

    if (id) {
      // Fetch specific training plan by ID
      where.id = parseInt(id);
    } else if (curriculumId) {
      // Fetch training plan by curriculum and optionally project
      where.curriculumId = parseInt(curriculumId);
      if (projectId) {
        where.projectId = parseInt(projectId);
      }
    }

    const trainingPlans = await prisma.training_plans.findMany({
      where,
      include: {
        days: {
          include: {
            modules: {
              include: {
                module: {
                  include: {
                    course: true,
                    activities: true,
                    module_objectives: true
                  }
                },
                course: {
                  include: {
                    modules: true,
                    course_objectives: true
                  }
                },
                supportActivity: true
              },
              orderBy: {
                moduleOrder: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        },
        curriculum: {
          include: {
            curriculum_courses: {
              include: {
                course: {
                  include: {
                    modules: {
                      include: {
                        activities: true,
                        module_objectives: true
                      },
                      orderBy: {
                        moduleOrder: 'asc'
                      }
                    },
                    course_objectives: true
                  }
                }
              }
            },
            supportActivities: true
          }
        },
        project: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return single plan if fetching by ID
    if (id && trainingPlans.length > 0) {
      return res.status(200).json({
        success: true,
        data: trainingPlans[0]
      });
    }

    res.status(200).json({
      success: true,
      data: trainingPlans
    });
  } catch (error) {
    console.error('Error fetching training plans:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch training plans',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}