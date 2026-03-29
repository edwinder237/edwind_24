import { WorkOS } from '@workos-inc/node';
import { createHandler } from '../../../lib/api/createHandler';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    try {
      const sessionId = req.cookies.workos_session_id;
      const customReturnTo = req.query.returnTo;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081';
      const defaultReturnTo = `${baseUrl}/auth/post-logout`;
      const returnTo = customReturnTo ? `${baseUrl}${customReturnTo}` : defaultReturnTo;

      res.setHeader('Set-Cookie', [
        'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      ]);

      if (sessionId) {
        const logoutUrl = workos.userManagement.getLogoutUrl({
          sessionId: sessionId,
          returnTo: returnTo
        });
        res.redirect(302, logoutUrl);
      } else {
        res.redirect(302, customReturnTo || '/auth/post-logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      res.setHeader('Set-Cookie', [
        'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      ]);
      res.redirect(302, '/auth/post-logout');
    }
  }
});
