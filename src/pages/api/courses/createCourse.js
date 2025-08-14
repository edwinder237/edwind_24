import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      title,
      summary,
      language = 'english',
      deliveryMethod,
      level,
      courseCategory,
      courseStatus = 'draft',
      CourseType,
      targetAudience,
      cost,
      maxParticipants,
      code,
      tags,
      accessRestrictions,
      certification,
      resources,
      goLiveDate,
      deadline,
      published = false,
      isMandatoryToAllRole = false,
      backgroundImg,
      createdBy = 'system', // You should get this from session/auth
      sub_organizationId = 1 // You should get this from session/auth
    } = req.body;

    if (!title) {
      return res.status(400).json({ 
        success: false,
        message: 'Course title is required' 
      });
    }

    // Create the course
    const course = await prisma.courses.create({
      data: {
        title,
        summary: summary || null,
        language,
        deliveryMethod: deliveryMethod || null,
        level: level || null,
        courseCategory: courseCategory || null,
        courseStatus,
        CourseType: CourseType || null,
        targetAudience: targetAudience || null,
        cost: cost ? parseFloat(cost) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        code: code || null,
        tags: tags || null,
        accessRestrictions: accessRestrictions || null,
        certification: certification || null,
        resources: resources || null,
        goLiveDate: goLiveDate ? new Date(goLiveDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        published,
        isMandatoryToAllRole,
        backgroundImg: backgroundImg || null,
        createdBy,
        sub_organizationId
      }
    });

    // Fetch the created course with additional info
    const fullCourse = await prisma.courses.findUnique({
      where: { id: course.id },
      include: {
        modules: true,
        course_tags: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: fullCourse,
      courseId: course.id
    });

  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create course',
      error: error.message 
    });
  }
}