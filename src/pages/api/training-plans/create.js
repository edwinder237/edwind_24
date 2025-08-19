import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      curriculumId, 
      projectId, 
      title, 
      description, 
      totalDays, 
      days,
      createdBy 
    } = req.body;

    // Check if training plan already exists for this curriculum and project
    const existingPlan = await prisma.training_plans.findFirst({
      where: {
        curriculumId: parseInt(curriculumId),
        projectId: projectId ? parseInt(projectId) : null
      }
    });

    if (existingPlan) {
      return res.status(400).json({ 
        message: 'A training plan already exists for this curriculum and project combination' 
      });
    }

    // Create training plan with days and modules
    const trainingPlan = await prisma.training_plans.create({
      data: {
        curriculumId: parseInt(curriculumId),
        projectId: projectId ? parseInt(projectId) : null,
        title,
        description,
        totalDays: totalDays || 5,
        status: 'draft',
        createdBy,
        days: {
          create: days?.map((day, dayIndex) => ({
            dayNumber: dayIndex + 1,
            dayTitle: day.dayTitle,
            dayDescription: day.dayDescription,
            date: day.date ? new Date(day.date) : null,
            modules: {
              create: day.modules?.map((module, moduleIndex) => ({
                moduleId: module.moduleId ? parseInt(module.moduleId) : null,
                courseId: module.courseId ? parseInt(module.courseId) : null,
                supportActivityId: module.supportActivityId ? parseInt(module.supportActivityId) : null,
                customTitle: module.title || module.customTitle,
                customDuration: module.duration || module.customDuration,
                moduleOrder: moduleIndex + 1,
                activities: module.activities || null,
                learningObjectives: module.learningObjectives || null,
                notes: module.notes
              })) || []
            }
          })) || []
        }
      },
      include: {
        days: {
          include: {
            modules: {
              include: {
                module: true,
                course: true,
                supportActivity: true
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        },
        curriculum: true,
        project: true
      }
    });

    res.status(201).json({
      success: true,
      data: trainingPlan,
      message: 'Training plan created successfully'
    });
  } catch (error) {
    console.error('Error creating training plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create training plan',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}