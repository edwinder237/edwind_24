/**
 * Internal API - WorkOS Usage Stats
 * GET /api/internal/usage/workos
 *
 * Returns WorkOS usage metrics for cost tracking:
 * - Total users (MAU for billing)
 * - Organizations count
 * - Estimated costs based on WorkOS pricing
 */

import prisma from '../../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// WorkOS Pricing (as of 2024)
// Free tier: Up to 1M MAU included
// After that: $2,500 per 1M MAU
// SSO/Directory: Per connection pricing
// Custom domains: $99/month
// Audit logs: $5/org/month base
const WORKOS_PRICING = {
  mauFreeLimit: 1000000, // 1M free MAU
  mauOveragePerMillion: 2500, // $2,500 per 1M MAU after free tier
  customDomain: 99, // $99/month for custom domains
  auditLogsBase: 5, // $5/org/month
  ssoPerConnection: 0 // Included in plan (varies by agreement)
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication (owner only)
    const userId = req.cookies.workos_user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const membership = await prisma.organization_memberships.findFirst({
      where: { userId },
      select: { workos_role: true }
    });

    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Get counts from local database (faster than WorkOS API pagination)
    const [
      totalUsers,
      activeUsers,
      totalOrganizations,
      totalMemberships,
      usersThisMonth,
      newUsersThisMonth
    ] = await Promise.all([
      // Total users in system
      prisma.user.count(),

      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          last_login: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Total organizations
      prisma.organizations.count(),

      // Total organization memberships
      prisma.organization_memberships.count(),

      // Users active this calendar month (MAU approximation)
      prisma.user.count({
        where: {
          last_login: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    // Try to get additional data from WorkOS API
    let workosData = {
      available: false,
      users: null,
      organizations: null,
      error: null
    };

    try {
      // List users from WorkOS (paginated, get first page for count estimate)
      const workosUsers = await workos.userManagement.listUsers({
        limit: 1 // Just to get the metadata
      });

      // List organizations from WorkOS
      const workosOrgs = await workos.organizations.listOrganizations({
        limit: 1
      });

      workosData = {
        available: true,
        users: {
          // WorkOS doesn't expose total count directly, use local DB
          estimatedTotal: totalUsers
        },
        organizations: {
          estimatedTotal: totalOrganizations
        }
      };
    } catch (workosError) {
      workosData.error = workosError.message;
      console.warn('[WorkOS Usage] Failed to fetch from WorkOS API:', workosError.message);
    }

    // Calculate estimated costs
    const estimatedMAU = usersThisMonth || activeUsers; // Use this month's active users as MAU
    const mauOverage = Math.max(0, estimatedMAU - WORKOS_PRICING.mauFreeLimit);
    const mauCost = mauOverage > 0
      ? (mauOverage / 1000000) * WORKOS_PRICING.mauOveragePerMillion
      : 0;

    // Check if custom domain is enabled (you can adjust this based on your setup)
    const hasCustomDomain = process.env.WORKOS_CUSTOM_DOMAIN === 'true';
    const customDomainCost = hasCustomDomain ? WORKOS_PRICING.customDomain : 0;

    // Audit logs (if enabled)
    const hasAuditLogs = process.env.WORKOS_AUDIT_LOGS === 'true';
    const auditLogsCost = hasAuditLogs ? totalOrganizations * WORKOS_PRICING.auditLogsBase : 0;

    const totalEstimatedCost = mauCost + customDomainCost + auditLogsCost;

    // Get user growth data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: true
    });

    // Aggregate by month
    const monthlyGrowth = {};
    userGrowth.forEach(entry => {
      const month = entry.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyGrowth[month] = (monthlyGrowth[month] || 0) + entry._count;
    });

    return res.status(200).json({
      metrics: {
        totalUsers,
        activeUsers,
        usersThisMonth,
        newUsersThisMonth,
        totalOrganizations,
        totalMemberships,
        avgUsersPerOrg: totalOrganizations > 0
          ? Math.round(totalUsers / totalOrganizations * 10) / 10
          : 0
      },
      mau: {
        estimated: estimatedMAU,
        freeLimit: WORKOS_PRICING.mauFreeLimit,
        overage: mauOverage,
        withinFreeLimit: mauOverage === 0
      },
      costs: {
        mau: mauCost,
        customDomain: customDomainCost,
        auditLogs: auditLogsCost,
        total: totalEstimatedCost,
        breakdown: {
          mauRate: `$${WORKOS_PRICING.mauOveragePerMillion}/1M MAU`,
          customDomainRate: hasCustomDomain ? `$${WORKOS_PRICING.customDomain}/mo` : 'Not enabled',
          auditLogsRate: hasAuditLogs ? `$${WORKOS_PRICING.auditLogsBase}/org/mo` : 'Not enabled'
        }
      },
      workosApi: workosData,
      growth: {
        monthly: monthlyGrowth
      },
      pricing: WORKOS_PRICING,
      dataSource: 'database + workos_api'
    });

  } catch (error) {
    console.error('[WorkOS Usage] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch WorkOS usage data' });
  }
}
