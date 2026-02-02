import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  try {
    const sessionId = req.cookies.workos_session_id;
    // Allow custom returnTo URL (for inactive account redirect)
    const customReturnTo = req.query.returnTo;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081';
    const defaultReturnTo = `${baseUrl}/auth/post-logout`;
    const returnTo = customReturnTo ? `${baseUrl}${customReturnTo}` : defaultReturnTo;

    // Clear local cookies
    res.setHeader('Set-Cookie', [
      'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
    ]);

    if (sessionId) {
      // Generate the logout URL using WorkOS
      const logoutUrl = workos.userManagement.getLogoutUrl({
        sessionId: sessionId,
        returnTo: returnTo
      });

      // Redirect to WorkOS logout URL
      res.redirect(302, logoutUrl);
    } else {
      // No session, just redirect
      res.redirect(302, customReturnTo || '/auth/post-logout');
    }
  } catch (error) {
    console.error('Logout error:', error);

    // Fallback - clear cookies and redirect
    res.setHeader('Set-Cookie', [
      'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
    ]);

    res.redirect(302, '/auth/post-logout');
  }
}