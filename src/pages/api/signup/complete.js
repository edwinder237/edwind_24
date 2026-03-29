import { WorkOS } from '@workos-inc/node';
import { serialize } from 'cookie';
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
  scope: 'public',
  POST: async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      password,
      selectedPlan,
      isIndividual,
      organizationName,
      industry,
      teamSize,
      contactEmail,
      teamInvites
    } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'First name is required' });
    }

    const resolvedOrgName = isIndividual
      ? `${firstName} ${lastName || ''}`.trim()
      : (organizationName || '').trim();

    if (!resolvedOrgName) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in instead.'
      });
    }

    const workosInstance = getWorkOS();

    // 1. Create WorkOS user
    let workosUser;
    try {
      workosUser = await workosInstance.userManagement.createUser({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: (lastName || '').trim(),
        emailVerified: true
      });
    } catch (workosError) {
      console.error('WorkOS createUser error:', workosError);
      const errCode = workosError.code || '';
      const errMsg = workosError.message || '';

      if (errCode.includes('email_duplicate') || errCode.includes('duplicate') || errMsg.includes('already exists')) {
        return res.status(409).json({
          error: 'An account with this email already exists. Please log in instead.'
        });
      }
      if (errCode.includes('password') || errMsg.includes('password') || errMsg.includes('Password')) {
        return res.status(400).json({
          error: 'Password does not meet strength requirements. Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.'
        });
      }
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }

    // 2. Authenticate to get session token
    let authResult;
    try {
      authResult = await workosInstance.userManagement.authenticateWithPassword({
        clientId: process.env.WORKOS_CLIENT_ID,
        email: email.trim(),
        password
      });
    } catch (authError) {
      console.error('WorkOS authenticate error:', authError);
      try {
        await workosInstance.userManagement.deleteUser(workosUser.id);
      } catch (cleanupError) {
        console.error('Failed to clean up WorkOS user:', cleanupError);
      }
      return res.status(500).json({ error: 'Failed to authenticate. Please try again.' });
    }

    const { accessToken } = authResult;

    let sessionId = null;
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      sessionId = payload.sid;
    }

    // 3. Create DB user
    let user;
    try {
      user = await prisma.user.create({
        data: {
          id: workosUser.id,
          workos_user_id: workosUser.id,
          email: workosUser.email,
          name: `${firstName} ${lastName || ''}`.trim(),
          firstName: firstName.trim(),
          lastName: (lastName || '').trim(),
          username: email.split('@')[0],
          password: 'workos_managed',
          isActive: true,
          info: {
            bio: '',
            phone: '',
            workos_user: true,
            onboardingComplete: true,
            onboardedAt: new Date().toISOString()
          },
          sub_organizationId: null
        }
      });
    } catch (dbError) {
      console.error('DB user creation error:', dbError);
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }

    // 4. Create WorkOS organization
    let workosOrg = null;
    try {
      workosOrg = await workosInstance.organizations.createOrganization({
        name: resolvedOrgName,
        domainData: []
      });
    } catch (workosOrgError) {
      console.error('WorkOS organization creation error:', workosOrgError);
    }

    // 5. Create DB organization + sub-organization
    const organization = await prisma.organizations.create({
      data: {
        title: resolvedOrgName,
        description: null,
        workos_org_id: workosOrg?.id || null,
        createdBy: user.id,
        updatedby: user.id,
        published: true,
        status: 'active',
        type: isIndividual ? 'individual' : 'primary',
        info: {
          industry: industry || null,
          contactEmail: contactEmail || email || null,
          teamSize: isIndividual ? '1' : (teamSize || null),
          onboardedAt: new Date().toISOString(),
          selectedPlan: selectedPlan || 'essential',
          isIndividual: !!isIndividual
        }
      }
    });

    const subOrganization = await prisma.sub_organizations.create({
      data: {
        title: resolvedOrgName,
        description: `Primary sub-organization for ${resolvedOrgName}`,
        organizationId: organization.id,
        createdBy: user.id,
        updatedby: user.id
      }
    });

    // 6. Link user to sub-organization
    await prisma.user.update({
      where: { id: user.id },
      data: { sub_organizationId: subOrganization.id }
    });

    // 7. Assign Level 2 app role (Training Manager)
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

    // 8. Create WorkOS membership
    let membership = null;
    if (workosOrg) {
      try {
        membership = await workosInstance.userManagement.createOrganizationMembership({
          userId: workosUser.id,
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

    // 9. Build and cache claims
    if (membership) {
      try {
        const memberships = await workosInstance.userManagement.listOrganizationMemberships({
          userId: workosUser.id
        });
        await buildAndCacheClaims(workosUser.id, memberships.data || [], []);
      } catch (claimsError) {
        console.error('Error building claims:', claimsError);
      }
    }

    // 10. Create subscription
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
            reason: 'Sign-up',
            changedBy: user.id
          }
        });
      }
    } catch (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
    }

    // 11. Stripe checkout for ALL plans
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
      console.error('Stripe checkout error:', stripeError.message);
    }

    // 12. Send team invitations
    if (teamInvites && Array.isArray(teamInvites) && teamInvites.length > 0 && workosOrg) {
      for (const invite of teamInvites.slice(0, 5)) {
        if (!invite.email || !invite.email.trim()) continue;
        try {
          const invitation = await workosInstance.userManagement.sendInvitation({
            email: invite.email.trim(),
            organizationId: workosOrg.id,
            inviterUserId: workosUser.id,
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

    // 13. Set all session cookies
    const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
    const ORG_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

    const encryptedOrgData = encrypt({
      organizationId: organization.id,
      workosOrgId: organization.workos_org_id,
      title: organization.title,
      setAt: new Date().toISOString()
    });

    const isSecure = process.env.NODE_ENV === 'production';

    const cookies = [
      serialize('workos_user_id', workosUser.id, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/'
      }),
      serialize('workos_access_token', accessToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/'
      }),
      serialize('edwind_current_org', encryptedOrgData, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: ORG_COOKIE_MAX_AGE,
        path: '/'
      })
    ];

    if (sessionId) {
      cookies.push(
        serialize('workos_session_id', sessionId, {
          httpOnly: true,
          secure: isSecure,
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
          path: '/'
        })
      );
    }

    res.setHeader('Set-Cookie', cookies);

    return res.status(200).json({
      success: true,
      organization: {
        id: organization.id,
        title: organization.title,
        workos_org_id: organization.workos_org_id
      },
      selectedPlan: planId,
      checkoutUrl
    });
  }
});
