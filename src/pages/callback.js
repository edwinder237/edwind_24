import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { WorkOS } from '@workos-inc/node';
import prisma from '../lib/prisma';
import { buildAndCacheClaims } from '../lib/auth/claimsManager';

// Initialize WorkOS only when needed to avoid build-time errors
let workos;

const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

const CallbackPage = () => {
  const router = useRouter();

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
    const { user, accessToken, refreshToken, impersonator } = await workosInstance.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID,
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
    try {
      let existingUser = await prisma.user.findUnique({
        where: { workos_user_id: user.id }
      });

      if (!existingUser) {
        // For new users, we might need a default sub_organization (temporarily)
        // This will be overridden by proper organization assignment later
        let defaultSubOrg = await prisma.sub_organizations.findFirst();

        if (!defaultSubOrg) {
          // Create default organization and sub_organization if none exist
          const defaultOrg = await prisma.organizations.create({
            data: {
              title: 'Default Organization',
              description: 'Default organization for WorkOS users',
              createdBy: user.id,
              updatedby: user.id,
              published: true,
              status: 'active',
              type: 'default'
            }
          });

          defaultSubOrg = await prisma.sub_organizations.create({
            data: {
              title: 'Default Sub Organization',
              description: 'Default sub organization for WorkOS users',
              createdBy: user.id,
              updatedby: user.id,
              organizationId: defaultOrg.id
            }
          });
        }

        // Create new user with workos_user_id
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
            status: 'active',
            info: {
              bio: '',
              phone: '',
              workos_user: true
            },
            sub_organizationId: defaultSubOrg.id // Can be null later
          }
        });
        console.log(`✅ Created new user: ${user.email}`);
      } else {
        // Update existing user's profile from WorkOS on every login
        const updatedName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'WorkOS User';

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            workos_user_id: user.id, // Ensure workos_user_id is set
            email: user.email, // Sync email in case it changed
            name: updatedName, // Sync full name from WorkOS
            firstName: user.firstName || existingUser.firstName,
            lastName: user.lastName || existingUser.lastName
          }
        });
        console.log(`✅ Synced user profile from WorkOS: ${user.email}`);
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

    // Set session cookies including session ID for logout
    context.res.setHeader('Set-Cookie', [
      `workos_user_id=${user.id}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7 days
      `workos_access_token=${accessToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7 days
      `workos_session_id=${sessionId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`, // 7 days
    ]);

    
    // Redirect to the main app after successful authentication
    return {
      redirect: {
        destination: '/projects',
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