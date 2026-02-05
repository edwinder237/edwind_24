import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler, ValidationError, ForbiddenError } from '../../../lib/errors/index.js';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

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
      createdBy = 'system'
    } = req.body;

    // Get sub_organizationId from org context (session-based)
    const sub_organizationId = orgContext?.subOrganizationIds?.[0];

    if (!sub_organizationId) {
      throw new ValidationError('Unable to determine sub-organization. Please refresh and try again.');
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Course title is required'
      });
    }

    // Check course limit
    const limitCheck = await enforceResourceLimit(orgContext.organizationId, RESOURCES.COURSES);
    if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);

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
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));