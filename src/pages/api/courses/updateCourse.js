import prisma from '../../../lib/prisma';
import { isVersionLocked } from '../../../lib/utils/versionProtection';
import { createAuditLog, calculateFieldChanges, TRACKED_FIELDS } from '../../../lib/utils/auditLog';
import { attachUserClaims } from '../../../lib/auth/middleware';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get user info for audit logging
  await attachUserClaims(req, res);

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
      backgroundImg,
      changedByName,
      authorName,
    } = req.body;

    if (!id || !title) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and title are required',
      });
    }

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await prisma.courses.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if the course's current version is locked
    if (existingCourse.currentVersionId) {
      const locked = await isVersionLocked(prisma, existingCourse.currentVersionId);
      if (locked) {
        return res.status(403).json({
          success: false,
          error: 'Version locked',
          message: `This course version (${existingCourse.version}) has participants who have started. Create a new draft version to make changes.`,
          requiresNewVersion: true,
          courseId
        });
      }
    }

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
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        code: code || null,
        version: version || existingCourse.version,
        tags: tags || null,
        accessRestrictions: accessRestrictions || null,
        certification: certification || null,
        resources: resources || null,
        goLiveDate: goLiveDate ? new Date(goLiveDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        published: published || false,
        isMandatoryToAllRole: isMandatoryToAllRole || false,
        backgroundImg: backgroundImg || null,
        authorName: authorName !== undefined ? authorName : existingCourse.authorName,
        lastUpdated: new Date(),
      },
    });

    // Fetch the updated course with additional info
    const fullCourse = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        modules: true,
        course_tags: true,
      },
    });

    // Calculate field changes and log audit entry
    const fieldChanges = calculateFieldChanges(existingCourse, course, TRACKED_FIELDS.course);
    const userName = changedByName || req.userClaims?.name || existingCourse?.authorName || 'Author';
    await createAuditLog(prisma, {
      courseId,
      entityType: 'course',
      entityId: courseId,
      actionType: 'update',
      fieldChanges,
      metadata: { title: course.title },
      changedByName: userName,
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: fullCourse,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message,
    });
  }
}
