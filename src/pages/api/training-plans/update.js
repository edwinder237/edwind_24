import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  PUT: async (req, res) => {
    const {
      id,
      title,
      description,
      totalDays,
      status,
      days,
      updatedBy
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Training plan ID is required' });
    }

    // First, delete existing days and modules for a clean update
    await prisma.training_plan_days.deleteMany({
      where: {
        trainingPlanId: parseInt(id)
      }
    });

    // Update training plan with new data
    const trainingPlan = await prisma.training_plans.update({
      where: {
        id: parseInt(id)
      },
      data: {
        title,
        description,
        totalDays: totalDays || 5,
        status: status || 'draft',
        updatedBy,
        updatedAt: new Date(),
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

    res.status(200).json({
      success: true,
      data: trainingPlan,
      message: 'Training plan updated successfully'
    });
  }
});