/**
 * Debug endpoint to check current session
 */

export default async function handler(req, res) {
  const cookies = req.cookies;

  res.status(200).json({
    workos_user_id: cookies.workos_user_id || null,
    workos_access_token: cookies.workos_access_token ? 'SET' : null,
    workos_session_id: cookies.workos_session_id || null,
    all_cookies: Object.keys(cookies)
  });
}
