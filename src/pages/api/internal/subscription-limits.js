/**
 * Internal API - Manage subscription plan limits (Owner only)
 * GET /api/internal/subscription-limits - Fetch all plans with limits
 * PUT /api/internal/subscription-limits - Update a plan's resource limits
 */

import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';
import { PLAN_DEFINITIONS, RESOURCE_DISPLAY_INFO } from '../../../lib/features/featureAccess';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

const VALID_LIMIT_KEYS = Object.keys(RESOURCE_DISPLAY_INFO);

async function verifyOwner(req) {
  const userId = req.cookies.workos_user_id;
  if (!userId) return { error: 'Not authenticated', status: 401 };

  const user = await workos.userManagement.getUser(userId);
  if (!user) return { error: 'User not found', status: 401 };

  const membership = await prisma.organization_memberships.findFirst({
    where: { userId: user.id },
    select: { workos_role: true }
  });

  if (!membership || membership.workos_role !== 'owner') {
    return { error: 'Owner access required', status: 403 };
  }

  return { user, userId };
}

async function handleGet(req, res) {
  const plans = await prisma.subscription_plans.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      planId: true,
      name: true,
      description: true,
      resourceLimits: true,
      features: true,
      isActive: true,
      isPublic: true,
      updatedAt: true
    }
  });

  const plansWithDefaults = plans.map(plan => ({
    ...plan,
    codeDefaults: PLAN_DEFINITIONS[plan.planId]?.limits || {}
  }));

  // Also fetch all organizations with their usage stats
  const organizations = await prisma.organizations.findMany({
    include: {
      subscription: {
        include: {
          plan: {
            select: { planId: true, name: true, resourceLimits: true }
          }
        }
      },
      sub_organizations: {
        select: {
          id: true,
          _count: {
            select: {
              projects: true,
              users: true,
              instructors: true,
              courses: true,
              curriculums: true,
              participant_roles: true
            }
          }
        }
      }
    },
    orderBy: { title: 'asc' }
  });

  const orgUsage = organizations.map(org => {
    const subOrgs = org.sub_organizations || [];
    const planId = org.subscription?.planId || null;
    const planLimits = org.subscription?.plan?.resourceLimits || {};
    const codeLimits = planId ? (PLAN_DEFINITIONS[planId]?.limits || {}) : {};
    // Effective limits: DB plan limits > code defaults
    const effectiveLimits = { ...codeLimits, ...planLimits };
    // Apply custom limits if any
    if (org.subscription?.customLimits) {
      Object.assign(effectiveLimits, org.subscription.customLimits);
    }

    return {
      id: org.id,
      name: org.title,
      planId,
      planName: org.subscription?.plan?.name || 'None',
      status: org.subscription?.status || 'none',
      usage: {
        projects: subOrgs.reduce((a, s) => a + (s._count?.projects || 0), 0),
        participants: subOrgs.reduce((a, s) => a + (s._count?.users || 0), 0),
        instructors: subOrgs.reduce((a, s) => a + (s._count?.instructors || 0), 0),
        subOrganizations: subOrgs.length,
        courses: subOrgs.reduce((a, s) => a + (s._count?.courses || 0), 0),
        curriculums: subOrgs.reduce((a, s) => a + (s._count?.curriculums || 0), 0),
        customRoles: subOrgs.reduce((a, s) => a + (s._count?.participant_roles || 0), 0)
      },
      limits: effectiveLimits
    };
  });

  return res.status(200).json({ plans: plansWithDefaults, organizations: orgUsage });
}

async function handlePut(req, res) {
  const { planId, resourceLimits } = req.body;

  if (!planId || !resourceLimits) {
    return res.status(400).json({ error: 'planId and resourceLimits are required' });
  }

  // Validate planId
  const validPlanIds = ['essential', 'professional', 'enterprise'];
  if (!validPlanIds.includes(planId)) {
    return res.status(400).json({ error: 'Invalid planId' });
  }

  // Validate each limit key and value
  for (const [key, value] of Object.entries(resourceLimits)) {
    if (!VALID_LIMIT_KEYS.includes(key)) {
      return res.status(400).json({ error: `Invalid limit key: ${key}` });
    }
    if (typeof value !== 'number' || value < -1) {
      return res.status(400).json({ error: `Invalid value for ${key}: must be a number >= -1` });
    }
  }

  const updatedPlan = await prisma.subscription_plans.update({
    where: { planId },
    data: {
      resourceLimits,
      updatedAt: new Date()
    }
  });

  return res.status(200).json({
    success: true,
    plan: updatedPlan
  });
}

export default async function handler(req, res) {
  try {
    const auth = await verifyOwner(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }

    if (req.method === 'GET') {
      return handleGet(req, res);
    } else if (req.method === 'PUT') {
      return handlePut(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in subscription-limits API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
