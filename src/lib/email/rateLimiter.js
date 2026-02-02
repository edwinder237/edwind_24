/**
 * Email Rate Limiting and Retry Logic
 *
 * Provides rate limiting for batch email operations
 * and retry logic with exponential backoff for rate limit errors
 */

import { getResendClient } from './resendClient';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 600; // 600ms between emails (Resend allows ~2/sec)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second initial backoff

/**
 * Delay utility
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send email with retry logic for rate limit errors
 *
 * @param {Object} emailData - Email data to send
 * @param {Object} options - Options
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.initialDelay=1000] - Initial backoff delay in ms
 * @param {number} [options.retryCount=0] - Current retry count (internal)
 * @returns {Promise<Object>} Resend response or error object
 */
export async function sendWithRetry(emailData, options = {}) {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    retryCount = 0
  } = options;

  const resend = getResendClient();

  try {
    const response = await resend.emails.send(emailData);

    // Check if Resend returned an error in the response
    if (response.error) {
      const error = response.error;

      // Check for rate limit error (HTTP 429)
      if (error.statusCode === 429 || error.name === 'rate_limit_exceeded') {
        if (retryCount < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffDelay = initialDelay * Math.pow(2, retryCount);
          console.log(`[email-service] Rate limited, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          await delay(backoffDelay);
          return sendWithRetry(emailData, {
            ...options,
            retryCount: retryCount + 1
          });
        }
        // Max retries exceeded
        return {
          error: {
            message: `Rate limit exceeded after ${maxRetries} retries. Please try again later.`,
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429
          }
        };
      }

      // Return other errors as-is
      return response;
    }

    return response;
  } catch (error) {
    // Handle thrown errors (network issues, etc.)
    const statusCode = error.statusCode || error.status;

    // Check for rate limit in thrown errors
    if (statusCode === 429 || error.code === 'rate_limit_exceeded') {
      if (retryCount < maxRetries) {
        const backoffDelay = initialDelay * Math.pow(2, retryCount);
        console.log(`[email-service] Rate limited (exception), retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await delay(backoffDelay);
        return sendWithRetry(emailData, {
          ...options,
          retryCount: retryCount + 1
        });
      }
      return {
        error: {
          message: `Rate limit exceeded after ${maxRetries} retries. Please try again later.`,
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429
        }
      };
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Send batch of emails with rate limiting
 *
 * @param {Array<Object>} emails - Array of email data objects
 * @param {Object} options - Options
 * @param {number} [options.delayBetween=600] - Delay between emails in ms
 * @param {boolean} [options.stopOnError=false] - Stop batch on first error
 * @param {Function} [options.onProgress] - Progress callback (index, total, result)
 * @returns {Promise<Object>} Results summary
 */
export async function sendBatch(emails, options = {}) {
  const {
    delayBetween = RATE_LIMIT_DELAY,
    stopOnError = false,
    onProgress
  } = options;

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < emails.length; i++) {
    const emailData = emails[i];

    try {
      const response = await sendWithRetry(emailData);

      if (response.error) {
        failureCount++;
        results.push({
          index: i,
          status: 'failed',
          error: response.error.message || 'Email service error',
          errorCode: response.error.code || response.error.statusCode || null,
          isRateLimited: response.error.code === 'RATE_LIMIT_EXCEEDED' || response.error.statusCode === 429
        });

        if (stopOnError) break;
      } else {
        successCount++;
        results.push({
          index: i,
          status: 'sent',
          emailId: response.data?.id || response.id
        });
      }
    } catch (error) {
      failureCount++;
      results.push({
        index: i,
        status: 'failed',
        error: error.message
      });

      if (stopOnError) break;
    }

    // Call progress callback if provided
    if (onProgress) {
      onProgress(i, emails.length, results[results.length - 1]);
    }

    // Rate limiting delay (except for last email)
    if (i < emails.length - 1) {
      await delay(delayBetween);
    }
  }

  return {
    results,
    summary: {
      total: emails.length,
      sent: successCount,
      failed: failureCount,
      hasRateLimitErrors: results.some(r => r.isRateLimited)
    }
  };
}

// ============================================
// IP-based Rate Limiting (for API endpoints)
// ============================================

// In-memory store for IP-based rate limiting
const ipRateLimit = new Map();

/**
 * Default rate limit configuration
 */
export const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 3 // 3 requests per window
};

/**
 * Check if an IP is rate limited
 *
 * @param {string} ip - IP address to check
 * @param {Object} config - Rate limit configuration
 * @param {number} [config.windowMs=60000] - Window size in ms
 * @param {number} [config.maxRequests=3] - Max requests per window
 * @returns {boolean} True if rate limited
 */
export function isRateLimited(ip, config = RATE_LIMIT_CONFIG) {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  if (!ipRateLimit.has(ip)) {
    ipRateLimit.set(ip, []);
  }

  // Filter requests within the window
  const requests = ipRateLimit.get(ip).filter(timestamp => timestamp > windowStart);
  ipRateLimit.set(ip, [...requests, now]);

  return requests.length >= config.maxRequests;
}

/**
 * Get client IP from request
 *
 * @param {Object} req - HTTP request object
 * @returns {string} Client IP address
 */
export function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown';
}

/**
 * Rate limit middleware helper
 * Returns error response if rate limited, null otherwise
 *
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Object} config - Rate limit configuration
 * @returns {boolean} True if rate limited (response sent), false otherwise
 */
export function checkRateLimit(req, res, config = RATE_LIMIT_CONFIG) {
  const ip = getClientIP(req);

  if (isRateLimited(ip, config)) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    return true;
  }

  return false;
}

/**
 * Clean up old entries from the rate limit map
 * Call periodically to prevent memory leaks
 */
export function cleanupRateLimitMap() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const [ip, timestamps] of ipRateLimit.entries()) {
    const recent = timestamps.filter(t => t > now - maxAge);
    if (recent.length === 0) {
      ipRateLimit.delete(ip);
    } else {
      ipRateLimit.set(ip, recent);
    }
  }
}
