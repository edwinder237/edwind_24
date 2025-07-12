import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  try {
    // Generate AuthKit URL - this will show the WorkOS hosted AuthKit UI
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
      clientId: process.env.WORKOS_CLIENT_ID,
      // Optional: Add state parameter for security
      state: 'random-state-' + Math.random().toString(36).substring(7),
    });
    
    res.status(200).json({ url: authorizationUrl });
  } catch (error) {
    console.error('Error getting sign-in URL:', error);
    res.status(500).json({ error: 'Failed to get sign-in URL', details: error.message });
  }
}