/**
 * Usage Logger Utility
 *
 * Fire-and-forget async logging to track provider API usage.
 * Uses setImmediate to defer database writes and avoid blocking API responses.
 */

import prisma from '../prisma';

// Provider constants
export const PROVIDERS = {
  GEMINI: 'gemini',
  MAPS: 'maps',
  RESEND: 'resend',
  R2: 'r2'
};

// Estimated costs per unit (in USD)
// These are approximate and should be updated based on actual billing
const COST_ESTIMATES = {
  gemini: {
    perInputToken: 0.000000075, // $0.075 per 1M input tokens (Gemini Flash)
    perOutputToken: 0.0000003, // $0.30 per 1M output tokens
    charsPerToken: 4 // rough estimate
  },
  maps: {
    autocomplete: 0.00283, // $2.83 per 1000 requests
    placeDetails: 0.017, // $17 per 1000 requests
    mapLoad: 0.007 // $7 per 1000 Dynamic Map loads
  },
  resend: {
    perEmail: 0.001 // $1 per 1000 emails
  },
  r2: {
    perOperation: 0.0000045, // $0.0045 per 1000 Class A operations
    perGBEgress: 0.09 // $0.09 per GB egress
  }
};

/**
 * Calculate estimated cost based on provider and usage
 * @param {string} provider - Provider name
 * @param {string} action - Action performed
 * @param {number} inputSize - Input size (chars/bytes)
 * @param {number} outputSize - Output size (chars/bytes)
 * @param {number} [actualInputTokens] - Actual input tokens from API response
 * @param {number} [actualOutputTokens] - Actual output tokens from API response
 */
function calculateCost(provider, action, inputSize, outputSize, actualInputTokens = null, actualOutputTokens = null) {
  try {
    switch (provider) {
      case PROVIDERS.GEMINI: {
        // Use actual tokens from API response if available, otherwise estimate
        const inputTokens = actualInputTokens || Math.ceil((inputSize || 0) / COST_ESTIMATES.gemini.charsPerToken);
        const outputTokens = actualOutputTokens || Math.ceil((outputSize || 0) / COST_ESTIMATES.gemini.charsPerToken);
        return (
          inputTokens * COST_ESTIMATES.gemini.perInputToken +
          outputTokens * COST_ESTIMATES.gemini.perOutputToken
        );
      }
      case PROVIDERS.MAPS: {
        if (action === 'place_details') {
          return COST_ESTIMATES.maps.placeDetails;
        }
        if (action === 'map_load') {
          return COST_ESTIMATES.maps.mapLoad;
        }
        return COST_ESTIMATES.maps.autocomplete;
      }
      case PROVIDERS.RESEND: {
        // inputSize is number of emails sent
        return (inputSize || 1) * COST_ESTIMATES.resend.perEmail;
      }
      case PROVIDERS.R2: {
        let cost = COST_ESTIMATES.r2.perOperation;
        // Add egress cost for larger files (inputSize in bytes)
        if (inputSize && inputSize > 10 * 1024 * 1024) {
          // 10MB+
          const sizeInGB = inputSize / (1024 * 1024 * 1024);
          cost += sizeInGB * COST_ESTIMATES.r2.perGBEgress;
        }
        return cost;
      }
      default:
        return 0;
    }
  } catch {
    return 0;
  }
}

/**
 * Log usage asynchronously (fire-and-forget)
 *
 * @param {Object} params
 * @param {string} params.provider - Provider name (gemini, maps, resend, r2)
 * @param {string} params.action - Action performed (summarize, autocomplete, send_email, upload)
 * @param {string} [params.organizationId] - Organization ID
 * @param {string} [params.userId] - WorkOS user ID
 * @param {number} [params.projectId] - Project ID if applicable
 * @param {number} [params.inputSize] - Input size (chars, bytes, or count)
 * @param {number} [params.outputSize] - Output size
 * @param {number} [params.durationMs] - Request duration in milliseconds
 * @param {boolean} [params.success=true] - Success status
 * @param {string} [params.errorCode] - Error code if failed
 * @param {number} [params.inputTokens] - Actual input tokens from API response
 * @param {number} [params.outputTokens] - Actual output tokens from API response
 * @param {number} [params.totalTokens] - Total tokens from API response
 */
export function logUsage({
  provider,
  action,
  organizationId = null,
  userId = null,
  projectId = null,
  inputSize = null,
  outputSize = null,
  durationMs = null,
  success = true,
  errorCode = null,
  inputTokens = null,
  outputTokens = null,
  totalTokens = null
}) {
  // Calculate estimated cost (uses actual tokens if available)
  const estimatedCostUsd = calculateCost(provider, action, inputSize, outputSize, inputTokens, outputTokens);

  // Fire-and-forget: use setImmediate to not block the response
  setImmediate(async () => {
    try {
      await prisma.usage_logs.create({
        data: {
          provider,
          action,
          organizationId,
          userId,
          projectId,
          inputSize,
          outputSize,
          durationMs,
          success,
          errorCode,
          estimatedCostUsd,
          inputTokens,
          outputTokens,
          totalTokens
        }
      });
    } catch (error) {
      // Log to console but don't throw - usage logging should never break main flow
      console.error('[UsageLogger] Failed to log usage:', error.message);
    }
  });
}

/**
 * Get organization ID from a project
 * Helper function to resolve org context from project
 */
export async function getOrgIdFromProject(projectId) {
  if (!projectId) return null;

  try {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        sub_organization: {
          select: { organizationId: true }
        }
      }
    });
    return project?.sub_organization?.organizationId || null;
  } catch {
    return null;
  }
}

/**
 * Get organization ID from a WorkOS user ID
 * Uses the user's current sub_organization (their active working context)
 */
export async function getOrgIdFromUser(workosUserId) {
  if (!workosUserId) return null;

  try {
    // Get user's current sub_organization (their active working context)
    const user = await prisma.user.findFirst({
      where: { workos_user_id: workosUserId },
      select: { sub_organization: { select: { organizationId: true } } }
    });
    return user?.sub_organization?.organizationId || null;
  } catch {
    return null;
  }
}

export default { logUsage, getOrgIdFromProject, getOrgIdFromUser, PROVIDERS };
