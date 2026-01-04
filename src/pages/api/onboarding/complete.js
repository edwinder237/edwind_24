import { WorkOS } from '@workos-inc/node';
import { parse, serialize } from 'cookie';
import prisma from '../../../lib/prisma';
import { buildAndCacheClaims } from '../../../lib/auth/claimsManager';
import { encrypt } from '../../../lib/crypto/index.js';

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
      organizationDescription,
      industry,
      website,
      contactName,
      contactEmail,
      contactPhone,
      teamSize
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
        description: organizationDescription || null,
        workos_org_id: workosOrg?.id || null,
        createdBy: user.id,
        updatedby: user.id,
        published: true,
        status: 'active',
        type: 'primary',
        info: {
          industry: industry || null,
          website: website || null,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          teamSize: teamSize || null,
          onboardedAt: new Date().toISOString()
        }
      }
    });

    console.log(`✅ Created local organization: ${organization.id}`);

    // 3. Create default sub-organization
    const subOrganization = await prisma.sub_organizations.create({
      data: {
        title: 'Default',
        description: `Default sub-organization for ${organizationName}`,
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

    // 5. Create organization membership in WorkOS if we have a WorkOS org
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

    // 6. Rebuild claims cache if membership was created
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

    // 7. Create a default subscription (free tier)
    try {
      // Check if free plan exists
      const freePlan = await prisma.subscription_plans.findUnique({
        where: { planId: 'free' }
      });

      if (freePlan) {
        await prisma.subscriptions.create({
          data: {
            organizationId: organization.id,
            planId: 'free',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          }
        });
        console.log(`✅ Created free subscription`);
      }
    } catch (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      // Non-critical error
    }

    console.log(`🎉 Onboarding complete for ${user.email}`);

    // 8. Set the organization cookie so user is immediately in the right context
    // We set this directly without validation since we just created the membership
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
      }
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({
      error: 'Failed to complete onboarding',
      details: error.message
    });
  }
}
