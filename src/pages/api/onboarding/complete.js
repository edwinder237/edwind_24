import { WorkOS } from '@workos-inc/node';
import { parse, serialize } from 'cookie';
import prisma from '../../../lib/prisma';
import { buildAndCacheClaims } from '../../../lib/auth/claimsManager';
import { encrypt } from '../../../lib/crypto/index.js';
import { createCheckoutSession, getPriceIdForPlan } from '../../../lib/stripe/stripeService.js';

// Initialize WorkOS
let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from cookie
    const cookies = parse(req.headers.cookie || '');
    const workosUserId = cookies.workos_user_id;

    if (!workosUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get form data
    const {
      organizationName,
      industry,
      teamSize,
      contactEmail,
      selectedPlan,
      teamInvites
    } = req.body;

    // Validate required fields
    if (!organizationName || !organizationName.trim()) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { workos_user_id: workosUserId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`🏢 Creating organization for user: ${user.email}`);

    // Initialize WorkOS client
    const workosInstance = getWorkOS();

    // 1. Create organization in WorkOS
    let workosOrg;
    try {
      workosOrg = await workosInstance.organizations.createOrganization({
        name: organizationName.trim(),
        domainData: [] // No domain restrictions
      });
      console.log(`✅ Created WorkOS organization: ${workosOrg.id}`);
    } catch (workosError) {
      console.error('WorkOS organization creation error:', workosError);
      // Continue without WorkOS - we can sync later
      workosOrg = null;
    }

    // 2. Create organization in local database
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

    console.log(`✅ Created local organization: ${organization.id}`);

    // 3. Create default sub-organization
    const subOrganization = await prisma.sub_organizations.create({
      data: {
        title: organizationName.trim(),
        description: `Primary sub-organization for ${organizationName}`,
        organizationId: organization.id,
        createdBy: user.id,
        updatedby: user.id
      }
    });

    console.log(`✅ Created sub-organization: ${subOrganization.id}`);

    // 4. Update user to link to sub-organization
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

    console.log(`✅ Updated user with sub-organization`);

    // 5. Assign Level 2 app role (Training Manager) to the creator
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
        console.log(`✅ Assigned Training Manager (Level 2) app role`);
      }
    } catch (roleError) {
      console.error('Error assigning app role:', roleError.message);
    }

    // 6. Create organization membership in WorkOS if we have a WorkOS org
    let membership = null;
    if (workosOrg) {
      try {
        membership = await workosInstance.userManagement.createOrganizationMembership({
          userId: workosUserId,
          organizationId: workosOrg.id,
          roleSlug: 'admin' // Creator gets admin role
        });
        console.log(`✅ Created WorkOS membership: ${membership.id}`);

        // Store membership in local database
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

        console.log(`✅ Stored membership in local database`);
      } catch (membershipError) {
        console.error('WorkOS membership creation error:', membershipError);
        // Continue without membership - can be synced later
      }
    }

    // 7. Rebuild claims cache if membership was created
    if (membership) {
      try {
        const memberships = await workosInstance.userManagement.listOrganizationMemberships({
          userId: workosUserId
        });

        await buildAndCacheClaims(workosUserId, memberships.data || [], []);
        console.log(`✅ Rebuilt claims cache`);
      } catch (claimsError) {
        console.error('Error rebuilding claims:', claimsError);
        // Non-critical error
      }
    }

    // 8. Create subscription based on selected plan
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
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        };

        if (planId === 'professional') {
          // 14-day trial
          subscriptionData.status = 'trialing';
          subscriptionData.trialStart = new Date();
          subscriptionData.trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          subscriptionData.currentPeriodEnd = subscriptionData.trialEnd;
        } else {
          subscriptionData.status = 'active';
        }

        const createdSubscription = await prisma.subscriptions.create({ data: subscriptionData });

        // Record in subscription_history
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

        console.log(`✅ Created ${planId} subscription (${subscriptionData.status})`);
      }
    } catch (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      // Non-critical error
    }

    // 9. For Professional plan: create Stripe checkout session with 14-day trial
    let checkoutUrl = null;

    if (planId === 'professional') {
      try {
        const priceId = await getPriceIdForPlan('professional', 'monthly');

        if (priceId) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 8081}`;
          const session = await createCheckoutSession({
            organizationId: organization.id,
            priceId,
            successUrl: `${baseUrl}/onboarding?checkout=success`,
            cancelUrl: `${baseUrl}/onboarding?checkout=canceled`,
            interval: 'monthly',
            trialDays: 14
          });
          checkoutUrl = session.url;
          console.log(`✅ Created Stripe checkout session for Professional trial`);
        } else {
          console.warn('⚠️ No Stripe price configured for Professional plan — skipping checkout');
        }
      } catch (stripeError) {
        console.error('Stripe checkout creation error:', stripeError.message);
        // Non-critical — user can add payment later from org settings
      }
    }

    // 10. Send team invitations (if provided)
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

          // Create pending user record
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
          console.log(`✅ Invited ${invite.email}`);
        } catch (inviteError) {
          console.error(`Failed to invite ${invite.email}:`, inviteError.message);
          // Non-critical — continue with other invites
        }
      }
    }

    console.log(`🎉 Onboarding complete for ${user.email} (plan: ${planId})`);

    // 11. Set the organization cookie so user is immediately in the right context
    const ORG_COOKIE_NAME = 'edwind_current_org';
    const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

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
    console.log(`✅ Set organization cookie for ${organization.title}`);

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
      checkoutUrl // null for Essential, Stripe URL for Professional
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({
      error: 'Failed to complete onboarding',
      details: error.message
    });
  }
}
