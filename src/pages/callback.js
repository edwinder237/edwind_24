import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { WorkOS } from '@workos-inc/node';
import { PrismaClient } from '@prisma/client';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const prisma = new PrismaClient();

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
    const { user, accessToken, refreshToken, impersonator } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID,
    });

    // Extract session ID from the access token
    const tokenParts = accessToken.split('.');
    let sessionId = null;
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      sessionId = payload.sid;
    }

    // Sync user with database
    try {
      let existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!existingUser) {
        // Get or create a default sub_organization
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

        // Create new user
        await prisma.user.create({
          data: {
            id: user.id,
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
            sub_organizationId: defaultSubOrg.id
          }
        });
      }
    } catch (dbError) {
      console.error('Database sync error:', dbError);
      // Continue with authentication even if DB sync fails
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