/**
 * ============================================
 * GET /api/search/global
 * ============================================
 *
 * Global search across projects, courses, curriculums, and participants.
 * Returns results grouped by type, limited to 5 per category.
 *
 * Query parameters:
 * - q: Search query (required, min 2 chars)
 *
 * Response:
 * {
 *   success: true,
 *   results: {
 *     projects: [...],
 *     courses: [...],
 *     curriculums: [...],
 *     participants: [...]
 *   },
 *   totalCount: number
 * }
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindMany } from '../../../lib/prisma/scopedQueries.js';

const RESULTS_PER_TYPE = 5;

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { q: query } = req.query;

  // Validate organization context for multi-tenancy
  if (!orgContext || !orgContext.subOrganizationIds || orgContext.subOrganizationIds.length === 0) {
    return res.status(403).json({
      error: 'No organization access',
      message: 'User does not have access to any sub-organizations'
    });
  }

  // Validate query
  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      error: 'Search query must be at least 2 characters'
    });
  }

  const searchTerm = query.trim();

  try {
    // Run all searches in parallel for performance
    // MULTI-TENANCY: Each query is scoped to user's subOrganizationIds
    const [projects, courses, curriculums, participants] = await Promise.all([
      // Search Projects (uses scopedFindMany which adds sub_organizationId filter)
      scopedFindMany(orgContext, 'projects', {
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { summary: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          summary: true,
          projectStatus: true,
          startDate: true
        },
        take: RESULTS_PER_TYPE,
        orderBy: { createdAt: 'desc' }
      }),

      // Search Courses (uses scopedFindMany which adds sub_organizationId filter)
      scopedFindMany(orgContext, 'courses', {
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { summary: { contains: searchTerm, mode: 'insensitive' } },
            { code: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          summary: true,
          code: true,
          courseStatus: true
        },
        take: RESULTS_PER_TYPE,
        orderBy: { createdAt: 'desc' }
      }),

      // Search Curriculums (uses scopedFindMany which adds sub_organizationId filter)
      scopedFindMany(orgContext, 'curriculums', {
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          isDefault: true
        },
        take: RESULTS_PER_TYPE,
        orderBy: { createdAt: 'desc' }
      }),

      // Search Participants (custom query - participants table uses 'sub_organization' field, not 'sub_organizationId')
      // MULTI-TENANCY: Explicitly filter by sub_organization to match user's accessible orgs
      // Supports full name search by splitting terms and matching each part against firstName OR lastName
      (async () => {
        const searchParts = searchTerm.split(/\s+/).filter(part => part.length > 0);

        // Build WHERE clause - if multiple words, ALL must match (firstName or lastName)
        // e.g., "marc nelson" → firstName contains "marc" AND lastName contains "nelson" (or vice versa)
        let participantWhere;

        if (searchParts.length > 1) {
          // Multi-word search: each part must match firstName OR lastName
          participantWhere = {
            sub_organization: { in: orgContext.subOrganizationIds },
            AND: searchParts.map(part => ({
              OR: [
                { firstName: { contains: part, mode: 'insensitive' } },
                { lastName: { contains: part, mode: 'insensitive' } }
              ]
            }))
          };
        } else {
          // Single word: match firstName, lastName, or email
          participantWhere = {
            sub_organization: { in: orgContext.subOrganizationIds },
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } }
            ]
          };
        }

        return prisma.participants.findMany({
          where: participantWhere,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            participantStatus: true
          },
          take: RESULTS_PER_TYPE,
          orderBy: { createdAt: 'desc' }
        });
      })()
    ]);

    // Format results with type indicators
    const formattedResults = {
      projects: projects.map(p => ({
        ...p,
        type: 'project',
        url: `/projects/${p.id}`
      })),
      courses: courses.map(c => ({
        ...c,
        type: 'course',
        url: `/courses/${c.id}`
      })),
      curriculums: curriculums.map(c => ({
        ...c,
        type: 'curriculum',
        url: `/curriculums/${c.id}`
      })),
      participants: participants.map(p => ({
        ...p,
        type: 'participant',
        displayName: `${p.firstName} ${p.lastName}`,
        url: `/project-manager/participants/${p.id}`
      }))
    };

    const totalCount =
      formattedResults.projects.length +
      formattedResults.courses.length +
      formattedResults.curriculums.length +
      formattedResults.participants.length;

    return res.status(200).json({
      success: true,
      results: formattedResults,
      totalCount,
      query: searchTerm
    });

  } catch (error) {
    console.error('Global search error:', error);
    return res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
}

export default withOrgScope(handler);
