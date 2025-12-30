/**
 * ============================================
 * PUT /api/instructors/updateInstructor
 * ============================================
 *
 * Updates an instructor's information.
 * FIXED: Previously updated any instructor without org validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedUpdate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      bio,
      expertise,
      instructorType,
      status,
      profileImage,
      qualifications,
      hourlyRate,
      availability,
      updatedBy
    } = req.body;

    if (!id || !updatedBy) {
      throw new ValidationError('Instructor ID and updated by are required');
    }

    // Verify instructor ownership
    const existingInstructor = await scopedFindUnique(orgContext, 'instructors', {
      where: { id: parseInt(id) }
    });

    if (!existingInstructor) {
      throw new NotFoundError('Instructor not found');
    }

    // If email is being updated, check if it's already taken by another instructor
    if (email && email !== existingInstructor.email) {
      const emailExists = await prisma.instructors.findFirst({
        where: {
          email,
          sub_organizationId: { in: orgContext.subOrganizationIds },
          NOT: { id: parseInt(id) }
        }
      });

      if (emailExists) {
        throw new ValidationError('An instructor with this email already exists');
      }
    }

    const updateData = {
      updatedBy,
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (instructorType !== undefined) updateData.instructorType = instructorType;
    if (status !== undefined) updateData.status = status;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
    if (availability !== undefined) updateData.availability = availability;

    const instructor = await scopedUpdate(orgContext, 'instructors', {
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bio: true,
        expertise: true,
        instructorType: true,
        status: true,
        profileImage: true,
        qualifications: true,
        hourlyRate: true,
        availability: true,
        sub_organizationId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Instructor updated successfully',
      data: instructor
    });

  } catch (error) {
    console.error('Error updating instructor:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
