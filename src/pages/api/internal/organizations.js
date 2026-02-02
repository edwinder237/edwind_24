/**
 * Internal API - Get all organizations (Owner only)
 * GET /api/internal/organizations
 */

import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const userId = req.cookies.workos_user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS and verify owner role
    const user = await workos.userManagement.getUser(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's organization membership
    const membership = await prisma.organization_memberships.findFirst({
      where: { userId: user.id },
      select: { workos_role: true }
    });

    // Only owners can access internal organizations
    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Parse query params
    const {
      search,
      page = '1',
      limit = '25'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get organizations with related data
    const [organizations, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        include: {
          subscription: {
            include: {
              plan: true
            }
          },
          sub_organizations: {
            select: {
              id: true,
              title: true,
              _count: {
                select: {
                  projects: true,
                  users: true,
                  instructors: true,
                  courses: true
                }
              }
            }
          },
          _count: {
            select: {
              organization_memberships: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.organizations.count({ where })
    ]);

    // Format response
    const formattedOrganizations = organizations.map(org => {
      // Aggregate sub-org stats
      const totalProjects = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.projects || 0), 0
      );
      const totalUsers = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.users || 0), 0
      );
      const totalInstructors = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.instructors || 0), 0
      );
      const totalCourses = org.sub_organizations.reduce(
        (acc, so) => acc + (so._count?.courses || 0), 0
      );

      return {
        id: org.id,
        title: org.title,
        description: org.description,
        workosOrgId: org.workos_org_id,
        status: org.status,
        type: org.type,
        logoUrl: org.logo_url,
        createdAt: org.createdAt,
        subscription: org.subscription ? {
          planId: org.subscription.planId,
          planName: org.subscription.plan?.name,
          status: org.subscription.status
        } : null,
        stats: {
          subOrganizations: org.sub_organizations.length,
          members: org._count.organization_memberships,
          projects: totalProjects,
          users: totalUsers,
          instructors: totalInstructors,
          courses: totalCourses
        }
      };
    });

    // Calculate aggregate stats
    const totalOrgs = await prisma.organizations.count();
    const activeSubscriptions = await prisma.subscriptions.count({
      where: { status: 'active' }
    });

    return res.status(200).json({
      organizations: formattedOrganizations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: {
        totalOrganizations: totalOrgs,
        activeSubscriptions
      }
    });

  } catch (error) {
    console.error('Error fetching internal organizations:', error);
    return res.status(500).json({ error: 'Failed to fetch organizations' });
  }
}
