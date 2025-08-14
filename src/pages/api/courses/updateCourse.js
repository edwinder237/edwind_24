import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      id,
      title,
      summary,
      language,
      deliveryMethod,
      level,
      courseCategory,
      courseStatus,
      CourseType,
      targetAudience,
      cost,
      maxParticipants,
      code,
      version,
      tags,
      accessRestrictions,
      certification,
      resources,
      goLiveDate,
      deadline,
      published,
      isMandatoryToAllRole,
      backgroundImg
    } = req.body;

    if (!id || !title) {
      return res.status(400).json({ 
        success: false,
        message: 'Course ID and title are required' 
      });
    }

    const courseId = parseInt(id);

    // Update the course
    const course = await prisma.courses.update({
      where: { id: courseId },
      data: {
        title,
        summary: summary || null,
        language: language || 'english',
        deliveryMethod: deliveryMethod || null,
        level: level || null,
        courseCategory: courseCategory || null,
        courseStatus: courseStatus || 'draft',
        CourseType: CourseType || null,
        targetAudience: targetAudience || null,
        cost: cost ? parseFloat(cost) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        code: code || null,
        version: version || null,
        tags: tags || null,
        accessRestrictions: accessRestrictions || null,
        certification: certification || null,
        resources: resources || null,
        goLiveDate: goLiveDate ? new Date(goLiveDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        published: published || false,
        isMandatoryToAllRole: isMandatoryToAllRole || false,
        backgroundImg: backgroundImg || null,
        lastUpdated: new Date()
      }
    });

    // Fetch the updated course with additional info
    const fullCourse = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        modules: true,
        course_tags: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: fullCourse
    });

  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update course',
      error: error.message 
    });
  }
}