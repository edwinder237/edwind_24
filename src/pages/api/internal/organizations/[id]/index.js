/**
 * GET /api/internal/organizations/[id]  — Full org details (Owner only)
 * DELETE /api/internal/organizations/[id] — Hard delete (Owner only)
 */

import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';
import { getStripe, cancelSubscription as cancelStripeSubscription } from '../../../../../lib/stripe/stripeService';
import { invalidateSubscriptionCache } from '../../../../../lib/features/subscriptionService';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

/**
 * Revoke all WorkOS sessions for a user (non-blocking on failure)
 */
async function revokeUserSessions(workosUserId) {
  if (!workosUserId) return;

  try {
    // Guard: listSessions may not exist in all WorkOS SDK versions
    if (typeof workos.userManagement.listSessions !== 'function') return;

    const sessionsResponse = await workos.userManagement.listSessions({
      userId: workosUserId
    });

    const sessions = sessionsResponse.data || [];
    for (const session of sessions) {
      try {
        await workos.userManagement.revokeSession(session.id);
      } catch (revokeError) {
        console.error(`   Failed to revoke session ${session.id}:`, revokeError.message);
      }
    }
  } catch (error) {
    console.error('Error revoking user sessions:', error.message);
  }
}

/**
 * Verify the caller is an owner. Sends error response and returns null if auth fails.
 */
async function verifyOwner(req, res) {
  const userId = req.cookies.workos_user_id;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }

  const membership = await prisma.organization_memberships.findFirst({
    where: { userId },
    select: { workos_role: true, organizationId: true, userId: true }
  });

  if (!membership || membership.workos_role !== 'owner') {
    res.status(403).json({ error: 'Owner access required' });
    return null;
  }
  return membership;
}

// ── GET — Full organization details ──
async function handleGet(req, res, membership) {
  const { id: orgId } = req.query;

  const org = await prisma.organizations.findUnique({
    where: { id: orgId },
    include: {
      subscription: {
        include: {
          plan: true,
          history: {
            orderBy: { changedAt: 'desc' },
            take: 20
          }
        }
      },
      organization_memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              workos_user_id: true,
              createdAt: true,
              sub_organization: {
                select: { id: true, title: true }
              }
            }
          }
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
          organization_memberships: true,
          sub_organizations: true
        }
      }
    }
  });

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Aggregate sub-org stats
  const totalProjects = org.sub_organizations.reduce((acc, so) => acc + (so._count?.projects || 0), 0);
  const totalInstructors = org.sub_organizations.reduce((acc, so) => acc + (so._count?.instructors || 0), 0);
  const totalCourses = org.sub_organizations.reduce((acc, so) => acc + (so._count?.courses || 0), 0);

  // Get all users linked to this org's sub-orgs (includes users without org memberships)
  const subOrgIds = org.sub_organizations.map(so => so.id);
  const subOrgUsers = subOrgIds.length > 0
    ? await prisma.user.findMany({
        where: { sub_organizationId: { in: subOrgIds } },
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          workos_user_id: true,
          createdAt: true,
          sub_organization: { select: { id: true, title: true } }
        }
      })
    : [];

  // Build members from org_memberships
  const membershipUserIds = new Set();
  const members = org.organization_memberships.map(m => {
    if (m.user?.id) membershipUserIds.add(m.user.id);
    return {
      id: m.user?.id,
      name: m.user?.name,
      email: m.user?.email,
      firstName: m.user?.firstName,
      lastName: m.user?.lastName,
      isActive: m.user?.isActive,
      workosUserId: m.user?.workos_user_id,
      role: m.workos_role,
      status: m.status,
      createdAt: m.user?.createdAt,
      subOrganization: m.user?.sub_organization
        ? { id: m.user.sub_organization.id, title: m.user.sub_organization.title }
        : null
    };
  });

  // Add sub-org users that don't have an org membership (e.g. invited/pending users)
  for (const u of subOrgUsers) {
    if (!membershipUserIds.has(u.id)) {
      members.push({
        id: u.id,
        name: u.name,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: u.isActive,
        workosUserId: u.workos_user_id,
        role: null,
        status: 'no_membership',
        createdAt: u.createdAt,
        subOrganization: u.sub_organization
          ? { id: u.sub_organization.id, title: u.sub_organization.title }
          : null
      });
    }
  }

  // Format sub-orgs
  const subOrganizations = org.sub_organizations.map(so => ({
    id: so.id,
    title: so.title,
    stats: {
      projects: so._count?.projects || 0,
      users: so._count?.users || 0,
      instructors: so._count?.instructors || 0,
      courses: so._count?.courses || 0
    }
  }));

  // Format subscription
  let subscription = null;
  if (org.subscription) {
    subscription = {
      id: org.subscription.id,
      planId: org.subscription.planId,
      planName: org.subscription.plan?.name,
      status: org.subscription.status,
      stripeSubscriptionId: org.subscription.stripeSubscriptionId || null,
      stripeCustomerId: org.subscription.stripeCustomerId || null,
      trialStart: org.subscription.trialStart,
      trialEnd: org.subscription.trialEnd,
      currentPeriodStart: org.subscription.currentPeriodStart,
      currentPeriodEnd: org.subscription.currentPeriodEnd,
      canceledAt: org.subscription.canceledAt,
      createdAt: org.subscription.createdAt,
      history: org.subscription.history || []
    };
  }

  // Fetch invoices from Stripe if customer ID exists
  let invoices = [];
  if (org.subscription?.stripeCustomerId) {
    try {
      const stripe = getStripe();
      const stripeInvoices = await stripe.invoices.list({
        customer: org.subscription.stripeCustomerId,
        limit: 50
      });

      invoices = stripeInvoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_paid / 100,
        currency: (invoice.currency || 'usd').toUpperCase(),
        description: invoice.lines?.data?.[0]?.description || 'Subscription',
        created: new Date(invoice.created * 1000).toISOString(),
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url
      }));
    } catch (stripeErr) {
      console.error('Error fetching Stripe invoices for org:', stripeErr.message);
    }
  }

  return res.status(200).json({
    id: org.id,
    title: org.title,
    description: org.description,
    workosOrgId: org.workos_org_id,
    status: org.status || 'active',
    type: org.type,
    logoUrl: org.logo_url,
    createdAt: org.createdAt,
    info: org.info,
    subscription,
    members,
    subOrganizations,
    invoices,
    stats: {
      members: members.length,
      subOrganizations: org._count.sub_organizations,
      projects: totalProjects,
      users: members.length,
      instructors: totalInstructors,
      courses: totalCourses
    }
  });
}

// ── DELETE — Hard delete organization ──
async function handleDelete(req, res, membership) {
  const { id: orgId } = req.query;
  const { confirmTitle } = req.body;

  const org = await prisma.organizations.findUnique({
    where: { id: orgId },
    include: {
      subscription: {
        select: { stripeSubscriptionId: true, stripeCustomerId: true, status: true }
      },
      _count: {
        select: {
          organization_memberships: true,
          sub_organizations: true
        }
      }
    }
  });

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Prevent owner from deleting their own org
  if (membership.organizationId === orgId) {
    return res.status(400).json({ error: 'Cannot delete your own organization' });
  }

  // Safety: require typing org name to confirm
  if (!confirmTitle || confirmTitle !== org.title) {
    return res.status(400).json({
      error: 'Confirmation required',
      message: `You must type the organization name "${org.title}" to confirm deletion`
    });
  }

  // Audit log — record all external IDs before deletion
  console.log(`[AUDIT] Hard-deleting organization "${org.title}"`, {
    dbOrgId: orgId,
    workosOrgId: org.workos_org_id || null,
    stripeCustomerId: org.subscription?.stripeCustomerId || null,
    stripeSubscriptionId: org.subscription?.stripeSubscriptionId || null,
    members: org._count.organization_memberships,
    subOrganizations: org._count.sub_organizations,
    deletedBy: membership.userId,
    deletedByWorkosId: req.cookies.workos_user_id
  });

  // 1. Cancel Stripe subscription
  if (org.subscription?.stripeSubscriptionId && org.subscription.status !== 'canceled') {
    try {
      await cancelStripeSubscription({
        stripeSubscriptionId: org.subscription.stripeSubscriptionId,
        immediately: true
      });
    } catch (stripeError) {
      console.error('Failed to cancel Stripe subscription:', stripeError.message);
    }
  }

  // 2. Delete Stripe customer
  if (org.subscription?.stripeCustomerId) {
    try {
      const stripe = getStripe();
      await stripe.customers.del(org.subscription.stripeCustomerId);
    } catch (stripeError) {
      console.error('Failed to delete Stripe customer:', stripeError.message);
    }
  }

  // 3. Delete all org users from WorkOS and DB
  const orgMemberships = await prisma.organization_memberships.findMany({
    where: { organizationId: orgId },
    select: {
      userId: true,
      user: { select: { id: true, email: true, workos_user_id: true } }
    }
  });

  for (const m of orgMemberships) {
    // Resolve WorkOS user ID (fall back to email lookup if not in DB)
    let workosUserId = m.user?.workos_user_id;
    if (!workosUserId && m.user?.email) {
      try {
        const workosUsers = await workos.userManagement.listUsers({ email: m.user.email });
        const match = workosUsers.data?.[0];
        if (match) {
          workosUserId = match.id;
          console.log(`[AUDIT] Resolved WorkOS user by email: ${m.user.email} → ${workosUserId}`);
        }
      } catch (lookupError) {
        console.error('WorkOS user lookup by email failed:', lookupError.message);
      }
    }

    if (workosUserId) {
      await revokeUserSessions(workosUserId);

      try {
        await workos.userManagement.deleteUser(workosUserId);
      } catch (deleteError) {
        console.error(`Failed to delete WorkOS user ${workosUserId}:`, deleteError.message);
      }
    }

    // Delete user from DB
    if (m.user?.id) {
      try {
        await prisma.user.delete({ where: { id: m.user.id } });
      } catch (deleteError) {
        console.error(`Failed to delete DB user ${m.user.id}:`, deleteError.message);
      }
    }
  }

  // 4. Delete WorkOS organization
  if (org.workos_org_id) {
    try {
      await workos.organizations.deleteOrganization(org.workos_org_id);
    } catch (workosError) {
      console.error('Failed to delete WorkOS organization:', workosError.message);
    }
  }

  // 5. Delete DB organization (cascade handles the entire tree)
  await prisma.organizations.delete({
    where: { id: orgId }
  });

  // 6. Cleanup
  invalidateSubscriptionCache(orgId);

  return res.status(200).json({
    success: true,
    message: `Organization "${org.title}" permanently deleted`,
    deleted: {
      members: org._count.organization_memberships,
      subOrganizations: org._count.sub_organizations
    }
  });
}

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const membership = await verifyOwner(req, res);
    if (!membership) return;
    return handleGet(req, res, membership);
  },
  DELETE: async (req, res) => {
    const membership = await verifyOwner(req, res);
    if (!membership) return;
    return handleDelete(req, res, membership);
  }
});
