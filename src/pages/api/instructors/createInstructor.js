/**
 * ============================================
 * POST /api/instructors/createInstructor
 * ============================================
 *
 * Creates a new instructor for the current organization.
 * FIXED: Previously required manual sub_organizationId, now auto-scoped.
 *
 * Body:
 * - firstName (required)
 * - lastName (required)
 * - email (required)
 * - phone, bio, expertise, etc. (optional)
 *
 * Response:
 * {
 *   success: true,
 *   instructor: {...}
 * }
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedCreate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError } from '../../../lib/errors/index.js';
import { enforceResourceLimit } from '../../../lib/features/subscriptionService';
import { RESOURCES } from '../../../lib/features/featureAccess';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      expertise,
      instructorType = 'main',
      status = 'active',
      profileImage,
      qualifications,
      hourlyRate,
      availability,
      createdBy
    } = req.body;

    // Validate required fields (sub_organizationId no longer needed - auto-scoped)
    if (!firstName || !lastName || !email) {
      throw new ValidationError('First name, last name, and email are required');
    }

    // Check instructor limit
    const limitCheck = await enforceResourceLimit(orgContext.organizationId, RESOURCES.INSTRUCTORS);
    if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);

    // Check if instructor with email already exists
    const existingInstructor = await prisma.instructors.findUnique({
      where: { email }
    });

    if (existingInstructor) {
      throw new ValidationError('An instructor with this email already exists');
    }

    // Create instructor with automatic org scoping
    const instructor = await scopedCreate(orgContext, 'instructors', {
      firstName,
      lastName,
      email,
      phone,
      bio,
      expertise: expertise || [],
      instructorType,
      status,
      profileImage,
      qualifications,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      availability,
      createdBy: createdBy || orgContext.userId,
      updatedBy: createdBy || orgContext.userId
    }, {
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

    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      data: instructor,
      instructor: instructor // Keep both for backward compatibility
    });

  } catch (error) {
    console.error('Error creating instructor:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));