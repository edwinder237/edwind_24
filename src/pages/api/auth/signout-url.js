import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const logoutUrl = workos.userManagement.getLogoutUrl({
      sessionId: req.cookies.workos_session_id || req.headers['x-session-id'],
    });

    res.status(200).json({ url: logoutUrl });
  }
});
