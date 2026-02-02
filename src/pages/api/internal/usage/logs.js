/**
 * Internal API - Usage Logs (Owner only)
 *
 * GET /api/internal/usage/logs
 * Query parameters:
 *   - page: Page number (default: 1)
 *   - limit: Records per page (default: 50, max: 100)
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 *   - provider: Filter by provider
 *   - organizationId: Filter by organization
 *   - success: Filter by success status (true/false)
 */

import prisma from '../../../../lib/prisma';
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

    // Only owners can access internal usage logs
    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Parse query parameters
    const {
      page = '1',
      limit = '50',
      startDate,
      endDate,
      provider,
      organizationId,
      success
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (provider) where.provider = provider;
    if (organizationId) where.organizationId = organizationId;
    if (success !== undefined) where.success = success === 'true';

    // Run queries in parallel
    const [logs, totalCount] = await Promise.all([
      prisma.usage_logs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.usage_logs.count({ where })
    ]);

    // Fetch organization names for logs with organizationId
    const orgIds = [...new Set(logs.map((l) => l.organizationId).filter(Boolean))];
    const organizations =
      orgIds.length > 0
        ? await prisma.organizations.findMany({
            where: { id: { in: orgIds } },
            select: { id: true, title: true }
          })
        : [];
    const orgMap = new Map(organizations.map((o) => [o.id, o.title]));

    // Enrich logs with organization names
    const enrichedLogs = logs.map((log) => ({
      ...log,
      organizationName: log.organizationId ? orgMap.get(log.organizationId) || null : null
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      logs: enrichedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore: pageNum < totalPages
      }
    });
  } catch (error) {
    console.error('[Usage Logs] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch usage logs',
      details: error.message
    });
  }
}
