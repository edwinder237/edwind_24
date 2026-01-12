/**
 * AI Summarization API Route
 *
 * POST /api/ai/summarize-session-notes
 * Analyzes session notes and generates key highlights and challenges using Google Gemini AI
 */

import { summarizeSessionNotes } from '../../../lib/ai/gemini';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Extract session notes, attendance data, and parking lot items from request body
    const { sessionNotes, attendanceData, parkingLotItems } = req.body;

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

    // Call Gemini AI to summarize with optional attendance and parking lot data
    const summary = await summarizeSessionNotes(sessionNotes, attendanceData, parkingLotItems);

    console.log('[AI Summarization] Generated:', {
      highlights: summary.keyHighlights.length,
      challenges: summary.challenges.length
    });

    // Return the generated summary
    return res.status(200).json({
      success: true,
      data: {
        keyHighlights: summary.keyHighlights,
        challenges: summary.challenges
      }
    });

  } catch (error) {
    console.error('[AI Summarization] Error:', error);

    // Return user-friendly error message
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI summary'
    });
  }
}
