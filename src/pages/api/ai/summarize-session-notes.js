/**
 * AI Summarization API Route
 *
 * POST /api/ai/summarize-session-notes
 * Analyzes session notes and generates key highlights and challenges using Google Gemini AI
 */

import { createHandler } from '../../../lib/api/createHandler';
import { summarizeSessionNotes } from '../../../lib/ai/gemini';
import { WorkOS } from '@workos-inc/node';
import { logUsage, PROVIDERS, getOrgIdFromUser } from '../../../lib/usage/usageLogger';
import { enforceResourceLimit, getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';
import { RESOURCES, hasResourceCapacity } from '../../../lib/features/featureAccess';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    // Verify user session
    const userId = req.cookies.workos_user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS
    const user = await workos.userManagement.getUser(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's organization for usage tracking
    const organizationId = await getOrgIdFromUser(userId);

    // Check SmartPulse daily limit
    if (organizationId) {
      const limitCheck = await enforceResourceLimit(organizationId, RESOURCES.SMART_PULSE_PER_DAY);
      if (!limitCheck.allowed) return res.status(limitCheck.status).json(limitCheck.body);
    }

    // Extract session notes, attendance data, parking lot items, and AI settings from request body
    const { sessionNotes, attendanceData, parkingLotItems, tone, customTone, language } = req.body;

    // Validate input
    if (!sessionNotes || typeof sessionNotes !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: sessionNotes (string) is required'
      });
    }

    // Check if session notes are empty or too short
    if (sessionNotes.trim().length < 10) {
      return res.status(400).json({
        error: 'Session notes are too short to summarize. Please add more content.'
      });
    }

    console.log('[AI Summarization] Processing session notes, length:', sessionNotes.length);
    if (attendanceData) {
      console.log('[AI Summarization] Including attendance data:', attendanceData);
    }
    if (parkingLotItems && parkingLotItems.length > 0) {
      console.log('[AI Summarization] Including parking lot items:', parkingLotItems.length);
    }

    // Call Gemini AI to summarize with optional attendance, parking lot data, and AI settings
    try {
      const startTime = Date.now();
      const summary = await summarizeSessionNotes(sessionNotes, attendanceData, parkingLotItems, { tone, customTone, language });
      const durationMs = Date.now() - startTime;

      // Calculate output size for cost estimation
      const outputSize = JSON.stringify(summary).length;

      // Log usage with actual token counts from Gemini API (fire-and-forget)
      logUsage({
        provider: PROVIDERS.GEMINI,
        action: 'summarize_session_notes',
        organizationId,
        userId,
        inputSize: sessionNotes.length,
        outputSize,
        durationMs,
        success: true,
        inputTokens: summary.tokenUsage?.inputTokens,
        outputTokens: summary.tokenUsage?.outputTokens,
        totalTokens: summary.tokenUsage?.totalTokens
      });

      console.log('[AI Summarization] Generated:', {
        highlights: summary.keyHighlights.length,
        challenges: summary.challenges.length
      });

      // Get SmartPulse remaining count for the user
      let smartPulseRemaining = null;
      if (organizationId) {
        const subscription = await getOrgSubscription(organizationId);
        const usage = await getResourceUsage(organizationId);
        if (subscription) {
          const capacity = hasResourceCapacity({
            subscription,
            resource: RESOURCES.SMART_PULSE_PER_DAY,
            currentUsage: (usage[RESOURCES.SMART_PULSE_PER_DAY] || 0) + 1 // +1 for this request
          });
          smartPulseRemaining = {
            used: capacity.current,
            limit: capacity.limit,
            remaining: capacity.available
          };
        }
      }

      // Return the generated summary
      return res.status(200).json({
        success: true,
        data: {
          keyHighlights: summary.keyHighlights,
          challenges: summary.challenges
        },
        smartPulse: smartPulseRemaining
      });

    } catch (error) {
      console.error('[AI Summarization] Error:', error);

      // Log failed usage (organizationId may not be available in error case)
      logUsage({
        provider: PROVIDERS.GEMINI,
        action: 'summarize_session_notes',
        userId: req.cookies?.workos_user_id,
        inputSize: req.body?.sessionNotes?.length || 0,
        success: false,
        errorCode: error.message?.slice(0, 100)
      });

      // Determine appropriate status code based on error type
      let statusCode = 500;
      let userMessage = error.message || 'Failed to generate AI summary';

      // Map error messages to appropriate HTTP status codes
      if (userMessage.includes('not configured') || userMessage.includes('access denied')) {
        statusCode = 503; // Service Unavailable
      } else if (userMessage.includes('quota exceeded') || userMessage.includes('Too many requests')) {
        statusCode = 429; // Too Many Requests
      } else if (userMessage.includes('temporarily unavailable') || userMessage.includes('experiencing issues')) {
        statusCode = 503; // Service Unavailable
      } else if (userMessage.includes('timed out')) {
        statusCode = 504; // Gateway Timeout
      } else if (userMessage.includes('Unable to connect')) {
        statusCode = 502; // Bad Gateway
      }

      // Return user-friendly error message
      return res.status(statusCode).json({
        success: false,
        error: userMessage,
        errorType: statusCode === 429 ? 'rate_limit' :
                   statusCode === 503 ? 'service_unavailable' :
                   statusCode === 504 ? 'timeout' :
                   statusCode === 502 ? 'connection_error' : 'server_error'
      });
    }
  }
});
