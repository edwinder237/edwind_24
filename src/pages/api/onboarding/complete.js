import { WorkOS } from '@workos-inc/node';
import { parse, serialize } from 'cookie';
import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { buildAndCacheClaims } from '../../../lib/auth/claimsManager';
import { encrypt } from '../../../lib/crypto/index.js';
import { createCheckoutSession, getPriceIdForPlan } from '../../../lib/stripe/stripeService.js';

let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

export default createHandler({
  scope: 'auth',
  POST: async (req, res) => {
    const cookies = parse(req.headers.cookie || '');
    const workosUserId = cookies.workos_user_id;

    if (!workosUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      organizationName,
      industry,
      teamSize,
      contactEmail,
      selectedPlan,
      teamInvites
    } = req.body;

    if (!organizationName || !organizationName.trim()) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const user = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const workosInstance = getWorkOS();

    let workosOrg;
    try {
      workosOrg = await workosInstance.organizations.createOrganization({
        name: organizationName.trim(),
        domainData: []
      });
    } catch (workosError) {
      console.error('WorkOS organization creation error:', workosError);
      workosOrg = null;
    }

    const organization = await prisma.organizations.create({
      data: {
        title: organizationName.trim(),
        description: null,
        workos_org_id: workosOrg?.id || null,
        createdBy: user.id,
        updatedby: user.id,
        published: true,
        status: 'active',
        type: 'primary',
        info: {
          industry: industry || null,
          contactEmail: contactEmail || user.email || null,
          teamSize: teamSize || null,
          onboardedAt: new Date().toISOString(),
          selectedPlan: selectedPlan || 'essential'
        }
      }
    });

    const subOrganization = await prisma.sub_organizations.create({
      data: {
        title: organizationName.trim(),
        description: `Primary sub-organization for ${organizationName}`,
        organizationId: organization.id,
        createdBy: user.id,
        updatedby: user.id
      }
    });

    try {
      await prisma.sub_organization_participant_role.create({
        data: {
          title: 'Learner',
          description: 'Default participant role',
          sub_organizationId: subOrganization.id,
          isActive: true,
          isSystemDefault: true,
          createdBy: user.id
        }
      });
    } catch (roleCreationError) {
      console.error('Error creating default participant role:', roleCreationError.message);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sub_organizationId: subOrganization.id,
        info: {
          ...user.info,
          onboardingComplete: true,
          onboardedAt: new Date().toISOString()
        }
      }
    });

    try {
      const trainingManagerRole = await prisma.system_roles.findUnique({
        where: { slug: 'training_manager' }
      });

      if (trainingManagerRole) {
        await prisma.user_role_assignments.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            roleId: trainingManagerRole.id,
            assignedBy: user.id,
            isActive: true
          }
        });
      }
    } catch (roleError) {
      console.error('Error assigning app role:', roleError.message);
    }

    let membership = null;
    if (workosOrg) {
      try {
        membership = await workosInstance.userManagement.createOrganizationMembership({
          userId: workosUserId,
          organizationId: workosOrg.id,
          roleSlug: 'admin'
        });

        await prisma.organization_memberships.create({
          data: {
            workos_membership_id: membership.id,
            userId: user.id,
            organizationId: organization.id,
            workos_role: membership.role?.slug || 'admin',
            status: membership.status || 'active',
            cached_at: new Date()
          }
        });
      } catch (membershipError) {
        console.error('WorkOS membership creation error:', membershipError);
      }
    }

    if (membership) {
      try {
        const memberships = await workosInstance.userManagement.listOrganizationMemberships({
          userId: workosUserId
        });
        await buildAndCacheClaims(workosUserId, memberships.data || [], []);
      } catch (claimsError) {
        console.error('Error rebuilding claims:', claimsError);
      }
    }

    const planId = selectedPlan === 'professional' ? 'professional' : 'essential';
    try {
      const plan = await prisma.subscription_plans.findUnique({
        where: { planId }
      });

      if (plan) {
        const subscriptionData = {
          organizationId: organization.id,
          planId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        };

        if (planId === 'professional') {
          subscriptionData.status = 'trialing';
          subscriptionData.trialStart = new Date();
          subscriptionData.trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          subscriptionData.currentPeriodEnd = subscriptionData.trialEnd;
        } else {
          subscriptionData.status = 'active';
        }

        const createdSubscription = await prisma.subscriptions.create({ data: subscriptionData });

        await prisma.subscription_history.create({
          data: {
            subscriptionId: createdSubscription.id,
            eventType: planId === 'professional' ? 'trial_started' : 'created',
            toPlanId: planId,
            toStatus: subscriptionData.status,
            reason: 'Onboarding',
            changedBy: user.id
          }
        });
      }
    } catch (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
    }

    let checkoutUrl = null;
    try {
      const priceId = await getPriceIdForPlan(planId, 'monthly');
      if (priceId) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 8081}`;
        const trialDays = planId === 'professional' ? 14 : 0;
        const session = await createCheckoutSession({
          organizationId: organization.id,
          priceId,
          successUrl: `${baseUrl}/api/subscriptions/verify-checkout?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/`,
          interval: 'monthly',
          trialDays
        });
        checkoutUrl = session.url;
      }
    } catch (stripeError) {
      console.error('Stripe checkout creation error:', stripeError.message);
    }

    if (teamInvites && Array.isArray(teamInvites) && teamInvites.length > 0 && workosOrg) {
      for (const invite of teamInvites.slice(0, 5)) {
        if (!invite.email || !invite.email.trim()) continue;
        try {
          const invitation = await workosInstance.userManagement.sendInvitation({
            email: invite.email.trim(),
            organizationId: workosOrg.id,
            inviterUserId: workosUserId,
            roleSlug: invite.role || 'member',
            expiresInDays: 7
          });

          await prisma.user.create({
            data: {
              email: invite.email.trim(),
              firstName: '',
              lastName: '',
              name: invite.email.split('@')[0],
              username: invite.email.split('@')[0],
              password: 'pending_invitation',
              isActive: false,
              sub_organizationId: subOrganization.id,
              info: {
                invitedBy: user.id,
                invitedAt: new Date().toISOString(),
                workos_invitation_id: invitation.id,
                pendingRole: invite.role || 'member',
                invitedToOrganizationId: organization.id
              }
            }
          });
        } catch (inviteError) {
          console.error(`Failed to invite ${invite.email}:`, inviteError.message);
        }
      }
    }

    const ORG_COOKIE_NAME = 'edwind_current_org';
    const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

    const encryptedData = encrypt({
      organizationId: organization.id,
      workosOrgId: organization.workos_org_id,
      title: organization.title,
      setAt: new Date().toISOString()
    });

    const orgCookie = serialize(ORG_COOKIE_NAME, encryptedData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    });

    res.setHeader('Set-Cookie', orgCookie);

    return res.status(200).json({
      success: true,
      organization: {
        id: organization.id,
        title: organization.title,
        workos_org_id: organization.workos_org_id
      },
      subOrganization: {
        id: subOrganization.id,
        title: subOrganization.title
      },
      selectedPlan: planId,
      checkoutUrl
    });
  }
});
