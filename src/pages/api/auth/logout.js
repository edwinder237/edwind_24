import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  try {
    const sessionId = req.cookies.workos_session_id;
    
    if (sessionId) {
      // Generate the logout URL using WorkOS
      const logoutUrl = workos.userManagement.getLogoutUrl({
        sessionId: sessionId,
        returnTo: 'http://localhost:8081/auth/post-logout'
      });
      
      // Clear local cookies before redirecting to WorkOS logout
      res.setHeader('Set-Cookie', [
        'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      ]);
      
      // Redirect to WorkOS logout URL
      res.redirect(302, logoutUrl);
    } else {
      // No session, just clear cookies and redirect
      res.setHeader('Set-Cookie', [
        'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      ]);
      
      res.redirect(302, '/auth/post-logout');
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