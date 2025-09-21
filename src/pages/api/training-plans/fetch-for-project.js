import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Fetch training plans associated with the project or its curriculums
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        project_curriculums: {
          include: {
            curriculum: {
              include: {
                training_plans: {
                  where: {
                    status: { in: ['active', 'draft'] }
                  },
                  include: {
                    days: {
                      include: {
                        modules: {
                          include: {
                            course: { select: { title: true } },
                            module: { select: { title: true } },
                            supportActivity: { select: { title: true } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        training_plans: {
          where: {
            status: { in: ['active', 'draft'] }
          },
          include: {
            curriculum: { select: { title: true } },
            days: {
              include: {
                modules: {
                  include: {
                    course: { select: { title: true } },
                    module: { select: { title: true } },
                    supportActivity: { select: { title: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Collect all unique training plans
    const trainingPlansMap = new Map();

    // Add training plans directly associated with the project
    if (project.training_plans) {
      project.training_plans.forEach(plan => {
        trainingPlansMap.set(plan.id, {
          ...plan,
          source: 'project',
          curriculumTitle: plan.curriculum?.title || 'Direct Project Plan'
        });
      });
    }

    // Add training plans from project curriculums
    if (project.project_curriculums) {
      project.project_curriculums.forEach(pc => {
        if (pc.curriculum.training_plans) {
          pc.curriculum.training_plans.forEach(plan => {
            if (!trainingPlansMap.has(plan.id)) {
              trainingPlansMap.set(plan.id, {
                ...plan,
                source: 'curriculum',
                curriculumTitle: pc.curriculum.title
              });
            }
          });
        }
      });
    }

    const trainingPlans = Array.from(trainingPlansMap.values());

    // Calculate summary stats for each training plan
    const trainingPlansWithStats = trainingPlans.map(plan => {
      const totalItems = plan.days.reduce((total, day) => total + day.modules.length, 0);
      const totalDays = plan.days.length;
      
      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        totalDays: plan.totalDays,
        actualDays: totalDays,
        totalItems,
        curriculumTitle: plan.curriculumTitle,
        source: plan.source,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      trainingPlans: trainingPlansWithStats,
      count: trainingPlansWithStats.length
    });

  } catch (error) {
    console.error('Error fetching training plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch training plans',
      error: error.message
    });
  }
}