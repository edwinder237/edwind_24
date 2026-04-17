/**
 * CSRF Protection — Double Submit Cookie Pattern
 *
 * How it works:
 * 1. Server generates a random token and sets it as an HttpOnly cookie
 * 2. Client reads the token from a non-HttpOnly companion cookie and sends it as a header
 * 3. Server compares the cookie value with the header value
 *
 * An attacker's cross-origin request will carry the cookie automatically,
 * but cannot read it or set the matching header due to same-origin policy.
 */

import crypto from 'crypto';

const CSRF_COOKIE_NAME = '__csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

/**
 * Generate a cryptographically random CSRF token
 */
export function generateCsrfToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Build the Set-Cookie header value for the CSRF token.
 * Readable by JS (no HttpOnly) so the axios interceptor can attach it as a header.
 */
export function csrfCookieHeader(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Max-Age=${60 * 60 * 24}${secure}`;
}

/**
 * Validate the CSRF token on an incoming request.
 * Compares the cookie value against the header value using timing-safe comparison.
 *
 * @param {import('next').NextApiRequest} req
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateCsrf(req) {
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return { valid: true };
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers?.[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    return { valid: false, reason: 'Missing CSRF token' };
  }

  if (cookieToken.length !== headerToken.length) {
    return { valid: false, reason: 'Invalid CSRF token' };
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(cookieToken, 'utf8'),
    Buffer.from(headerToken, 'utf8')
  );

  return valid ? { valid: true } : { valid: false, reason: 'Invalid CSRF token' };
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
