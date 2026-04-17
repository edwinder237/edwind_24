/**
 * GET /api/auth/csrf-token
 *
 * Issues a fresh CSRF token. The token is set as a cookie (readable by JS)
 * so the axios interceptor can attach it as a header on every request.
 */

import { createHandler } from '../../../lib/api/createHandler';
import { generateCsrfToken, csrfCookieHeader } from '../../../lib/security/csrf';

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const token = generateCsrfToken();
    res.setHeader('Set-Cookie', csrfCookieHeader(token));
    res.status(200).json({ csrfToken: token });
  }
});
