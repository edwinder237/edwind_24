import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
      clientId: process.env.WORKOS_CLIENT_ID,
      state: 'random-state-' + Math.random().toString(36).substring(7),
    });

    res.status(200).json({ url: authorizationUrl });
  }
});
