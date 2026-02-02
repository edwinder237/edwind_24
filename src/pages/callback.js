import { useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { WorkOS } from '@workos-inc/node';
import { serialize } from 'cookie';
import prisma from '../lib/prisma';
import { buildAndCacheClaims } from '../lib/auth/claimsManager';
import { encrypt } from '../lib/crypto/index.js';

// Initialize WorkOS only when needed to avoid build-time errors
let workos;

const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

const CallbackPage = () => {
  useEffect(() => {
    // The actual authentication was handled in getServerSideProps
    // This component just shows a loading message while redirecting
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Completing authentication...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we sign you in.
        </Typography>
      </Box>
    </Container>
  );
};

export async function getServerSideProps(context) {
  try {
    const { code } = context.query;
    
    if (!code) {
      return {
        redirect: {
          destination: '/workos-test?error=no_code',
          permanent: false,
        },
      };
    }

    // Exchange the code for a session
    const workosInstance = getWorkOS();
    const authResult = await workosInstance.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID,
    });

    const { user, accessToken, organizationId: workosOrgId } = authResult;

    console.log('🔐 Auth result:', {
      userId: user.id,
      email: user.email,
      organizationId: workosOrgId || 'none selected'
    });

    // Extract session ID and permissions from the access token JWT
    const tokenParts = accessToken.split('.');
    let sessionId = null;
    let jwtPermissions = [];
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      sessionId = payload.sid;

      // Extract permissions from JWT
      // WorkOS includes permissions in the JWT token
      jwtPermissions = payload.permissions || [];

      console.log('🔑 JWT Payload:', JSON.stringify(payload, null, 2));
      console.log(`🔑 Permissions in JWT: ${jwtPermissions.length} permissions`);
      if (jwtPermissions.length > 0) {
        console.log('   ✅ Permissions:', jwtPermissions);
      } else {
        console.log('   ⚠️  NO PERMISSIONS IN JWT!');
        console.log('   💡 You need to assign permissions to the role in WorkOS dashboard');
        console.log('   📋 Go to: WorkOS Dashboard → Roles & Permissions → Select Role → Assign Permissions');
      }
    }

    // Fetch user's organization memberships from WorkOS
    let memberships = [];
    try {
      const membershipResponse = await workosInstance.userManagement.listOrganizationMemberships({
        userId: user.id
      });
      memberships = membershipResponse.data || [];
      console.log(`✅ Fetched ${memberships.length} organization memberships for user ${user.email}`);
    } catch (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      // Continue without memberships - will be handled during sync
    }

    // Sync user with database
    let isNewUser = false;
    let needsOnboarding = false;

    try {
      // First try to find by workos_user_id
      let existingUser = await prisma.user.findUnique({
        where: { workos_user_id: user.id }
      });

      // If not found by workos_user_id, try to find by email (for invited users)
      if (!existingUser) {
        existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (existingUser) {
          console.log(`🔗 Found invited user by email: ${user.email}, linking WorkOS ID`);
        }
      }

      // Block inactive users from logging in
      if (existingUser && existingUser.isActive === false) {
        console.log(`⛔ Inactive user attempted login: ${user.email}`);

        // Store the session ID in a cookie temporarily so logout API can use it
        // Then redirect through logout API to properly clear WorkOS session
        const cookiesToSet = [
          'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
          'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        ];

        // Keep session ID temporarily for logout, it will be cleared by logout API
        if (sessionId) {
          cookiesToSet.push(`workos_session_id=${sessionId}; HttpOnly; Path=/; Max-Age=60; SameSite=Lax`);
        }

        context.res.setHeader('Set-Cookie', cookiesToSet);

        // Redirect through our logout API which properly handles WorkOS logout
        return {
          redirect: {
            destination: '/api/auth/logout?returnTo=/?error=account_inactive',
            permanent: false,
          },
        };
      }

      if (!existingUser) {
        isNewUser = true;

        // Create new user with workos_user_id (no sub_organization yet - will be set during onboarding)
        await prisma.user.create({
          data: {
            id: user.id,
            workos_user_id: user.id, // Store WorkOS user ID
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'WorkOS User',
            firstName: user.firstName || 'WorkOS',
            lastName: user.lastName || 'User',
            username: user.email.split('@')[0],
            password: 'workos_managed',
            isActive: true,
            info: {
              bio: '',
              phone: '',
              workos_user: true,
              onboardingComplete: false
            },
            sub_organizationId: null // Will be set during onboarding
          }
        });
        console.log(`✅ Created new user: ${user.email}`);
        needsOnboarding = true;
      } else {
        // Check if this is an invited user being linked (had no workos_user_id before)
        const wasInvitedUser = !existingUser.workos_user_id;

        // Check if existing user needs onboarding
        const userInfo = existingUser.info || {};
        // Invited users with a sub_organizationId don't need onboarding
        if (!userInfo.onboardingComplete && !existingUser.sub_organizationId) {
          // User exists but hasn't completed onboarding
          needsOnboarding = true;
          console.log(`⚠️ Existing user needs onboarding: ${user.email}`);
        }

        // Update existing user's profile from WorkOS on every login
        const updatedName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || existingUser.name || 'WorkOS User';

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            workos_user_id: user.id, // Link WorkOS user ID (important for invited users!)
            email: user.email, // Sync email in case it changed
            name: updatedName, // Sync full name from WorkOS
            firstName: user.firstName || existingUser.firstName,
            lastName: user.lastName || existingUser.lastName
          }
        });

        if (wasInvitedUser) {
          console.log(`✅ Linked invited user to WorkOS: ${user.email} -> ${user.id}`);
        } else {
          console.log(`✅ Synced user profile from WorkOS: ${user.email}`);
        }
        console.log(`   Updated name to: ${updatedName}`);
      }
    } catch (dbError) {
      console.error('Database sync error:', dbError);
      // Continue with authentication even if DB sync fails
    }

    // Build and cache permission claims with JWT permissions
    try {
      const claims = await buildAndCacheClaims(user.id, memberships, jwtPermissions);
      if (claims) {
        console.log(`✅ Built and cached claims for user ${user.email}`);
        console.log(`   - ${claims.organizations.length} organizations`);
        claims.organizations.forEach(org => {
          console.log(`   - ${org.role} in org ${org.orgId} with ${org.permissions.length} permissions`);
          console.log(`   - Permissions:`, org.permissions);
        });
      } else {
        console.warn(`⚠️  Could not build claims for user ${user.email}`);
      }
    } catch (claimsError) {
      console.error('Error building claims:', claimsError);
      // Continue with authentication even if claims building fails
    }

    // Build organization cookie
    // Priority: 1) WorkOS selection from auth, 2) User's sub-organization, 3) First membership
    let orgCookie = null;
    let selectedOrg = null;

    try {
      // 1. Try to get org from WorkOS auth result
      if (workosOrgId) {
        selectedOrg = await prisma.organizations.findFirst({
          where: { workos_org_id: workosOrgId },
          select: {
            id: true,
            workos_org_id: true,
            title: true
          }
        });
        if (selectedOrg) {
          console.log(`🏢 Setting organization from WorkOS selection: ${selectedOrg.title}`);
        }
      }

      // 2. If no org from WorkOS, try to get from user's sub_organization
      if (!selectedOrg) {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { workos_user_id: user.id },
              { email: user.email }
            ]
          },
          select: {
            sub_organization: {
              select: {
                organization: {
                  select: {
                    id: true,
                    workos_org_id: true,
                    title: true
                  }
                }
              }
            }
          }
        });

        if (dbUser?.sub_organization?.organization) {
          selectedOrg = dbUser.sub_organization.organization;
          console.log(`🏢 Setting organization from user's sub-organization: ${selectedOrg.title}`);
        }
      }

      // 3. If still no org, try first membership
      if (!selectedOrg && memberships.length > 0) {
        const firstMembershipOrgId = memberships[0].organizationId;
        selectedOrg = await prisma.organizations.findFirst({
          where: { workos_org_id: firstMembershipOrgId },
          select: {
            id: true,
            workos_org_id: true,
            title: true
          }
        });
        if (selectedOrg) {
          console.log(`🏢 Setting organization from first membership: ${selectedOrg.title}`);
        }
      }

      // Create the cookie if we found an organization
      if (selectedOrg) {
        const encryptedData = encrypt({
          organizationId: selectedOrg.id,
          workosOrgId: selectedOrg.workos_org_id,
          title: selectedOrg.title,
          setAt: new Date().toISOString()
        });

        orgCookie = serialize('edwind_current_org', encryptedData, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/'
        });
        console.log(`✅ Organization cookie set for: ${selectedOrg.title}`);
      } else {
        console.warn(`⚠️  Could not determine organization for user ${user.email}`);
      }
    } catch (orgError) {
      console.error('Error setting organization cookie:', orgError);
      // Continue without setting org cookie
    }

    // Set session cookies including session ID for logout
    const cookies = [
      `workos_user_id=${user.id}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7 days
      `workos_access_token=${accessToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7 days
      `workos_session_id=${sessionId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7 days
    ];

    // Add organization cookie if we have one
    if (orgCookie) {
      cookies.push(orgCookie);
    }

    context.res.setHeader('Set-Cookie', cookies);


    // Redirect based on onboarding status
    const redirectDestination = needsOnboarding ? '/onboarding' : '/projects';

    console.log(`🔀 Redirecting to: ${redirectDestination} (isNewUser: ${isNewUser}, needsOnboarding: ${needsOnboarding})`);

    return {
      redirect: {
        destination: redirectDestination,
        permanent: false,
      },
    };
  } catch (error) {
    console.error('Error in callback:', error);
    return {
      redirect: {
        destination: '/workos-test?error=authentication_failed',
        permanent: false,
      },
    };
  }
}

export default CallbackPage;