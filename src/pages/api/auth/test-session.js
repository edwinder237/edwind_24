import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const cookies = req.cookies;

    res.status(200).json({
      hasWorkosUserId: !!cookies.workos_user_id,
      hasAccessToken: !!cookies.workos_access_token,
      hasSessionId: !!cookies.workos_session_id,
      workosUserId: cookies.workos_user_id || null,
      allCookies: Object.keys(cookies)
    });
  }
});
