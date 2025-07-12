import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  try {
    const logoutUrl = workos.userManagement.getLogoutUrl({
      sessionId: req.cookies.workos_session_id || req.headers['x-session-id'],
    });
    
    res.status(200).json({ url: logoutUrl });
  } catch (error) {
    console.error('Error getting sign-out URL:', error);
    res.status(500).json({ error: 'Failed to get sign-out URL' });
  }
}