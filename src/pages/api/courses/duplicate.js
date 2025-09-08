import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    // Fetch the original course with all related data
    const originalCourse = await prisma.courses.findUnique({
      where: { id: parseInt(id) },
      include: {
        modules: {
          include: {
            activities: true
          },
          orderBy: { moduleOrder: 'asc' }
        },
        course_checklist_items: true
      }
    });

    if (!originalCourse) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Create the duplicated course
    const duplicatedCourse = await prisma.courses.create({
      data: {
        title: `${originalCourse.title} (Copy)`,
        summary: originalCourse.summary,
        language: originalCourse.language,
        deliveryMethod: originalCourse.deliveryMethod,
        goLiveDate: originalCourse.goLiveDate,
        maxParticipants: originalCourse.maxParticipants,
        deadline: originalCourse.deadline,
        level: originalCourse.level,
        accessRestrictions: originalCourse.accessRestrictions,
        certification: originalCourse.certification,
        tags: originalCourse.tags,
        CourseType: originalCourse.CourseType,
        courseCategory: originalCourse.courseCategory,
        courseStatus: originalCourse.courseStatus,
        targetAudience: originalCourse.targetAudience,
        isMandatoryToAllRole: originalCourse.isMandatoryToAllRole,
        backgroundImg: originalCourse.backgroundImg,
        resources: originalCourse.resources,
        syllabusId: originalCourse.syllabusId,
        JSONSyllabus: originalCourse.JSONSyllabus,
        rating: originalCourse.rating,
        code: originalCourse.code,
        version: originalCourse.version,
        published: false, // Set as draft for duplicated courses
        sub_organizationId: originalCourse.sub_organizationId,
        createdBy: originalCourse.createdBy
      }
    });

    // Duplicate modules and their activities
    if (originalCourse.modules.length > 0) {
      for (const module of originalCourse.modules) {
        const duplicatedModule = await prisma.modules.create({
          data: {
            title: module.title,
            summary: module.summary,
            content: module.content,
            JSONContent: module.JSONContent,
            // Skip customDuration and duration to let them be calculated from activities
            moduleStatus: module.moduleStatus,
            backgroundImg: module.backgroundImg,
            moduleOrder: module.moduleOrder,
            published: module.published,
            courseId: duplicatedCourse.id
          }
        });

        // Duplicate activities for this module
        if (module.activities.length > 0) {
          await prisma.activities.createMany({
            data: module.activities.map(activity => ({
              title: activity.title,
              summary: activity.summary,
              content: activity.content,
              duration: activity.duration,
              activityType: activity.activityType,
              activityCategory: activity.activityCategory,
              activityStatus: activity.activityStatus,
              backgroundImg: activity.backgroundImg,
              ActivityOrder: activity.ActivityOrder,
              published: activity.published,
              moduleId: duplicatedModule.id
            }))
          });
        }
      }
    }

    // Duplicate course checklist items
    if (originalCourse.course_checklist_items.length > 0) {
      await prisma.course_checklist_items.createMany({
        data: originalCourse.course_checklist_items.map(checklistItem => ({
          title: checklistItem.title,
          description: checklistItem.description,
          category: checklistItem.category,
          priority: checklistItem.priority,
          itemOrder: checklistItem.itemOrder,
          moduleId: checklistItem.moduleId,
          courseId: duplicatedCourse.id,
          createdBy: checklistItem.createdBy
        }))
      });
    }

    // Fetch the complete duplicated course for response
    const completeDuplicatedCourse = await prisma.courses.findUnique({
      where: { id: duplicatedCourse.id },
      include: {
        modules: {
          include: {
            activities: true
          }
        },
        course_checklist_items: true
      }
    });

    // Format the response similar to fetchCourses
    const formattedCourse = {
      ...completeDuplicatedCourse,
      moduleCount: completeDuplicatedCourse.modules.length,
      activityCount: completeDuplicatedCourse.modules.reduce((total, module) => total + module.activities.length, 0),
      checklistCount: completeDuplicatedCourse.course_checklist_items.length
    };

    res.status(200).json({ 
      success: true, 
      message: 'Course duplicated successfully',
      course: formattedCourse
    });

  } catch (error) {
    console.error('Duplicate course error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to duplicate course',
      error: error.message 
    });
  }
}