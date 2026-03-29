/**
 * ============================================
 * GET /api/instructors/fetchInstructors
 * ============================================
 *
 * Returns all instructors for the current organization.
 * FIXED: Previously leaked instructor data across organizations.
 *
 * Query Params:
 * - sub_organizationId (optional): Filter by specific sub-organization
 * - instructorType (optional): Filter by instructor type
 * - status (optional): Filter by status
 *
 * Response:
 * [
 *   {
 *     id: number,
 *     firstName: string,
 *     lastName: string,
 *     email: string,
 *     ...
 *   }
 * ]
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext } = req;
    const { instructorType, status } = req.query;

    // Build where clause with optional filters
    const whereClause = {};

    if (instructorType) {
      whereClause.instructorType = instructorType;
    }

    if (status) {
      whereClause.status = status;
    }

    // scopedFindMany automatically filters by orgContext.subOrganizationIds
    const instructors = await scopedFindMany(orgContext, 'instructors', {
      where: whereClause,
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
        updatedAt: true,
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            project_instructors: true,
            course_instructors: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // Transform the response to include counts
    const instructorsWithCount = instructors.map(instructor => ({
      ...instructor,
      projectCount: instructor._count?.project_instructors || 0,
      courseCount: instructor._count?.course_instructors || 0
    }));

    res.status(200).json(instructorsWithCount);
  }
});