/**
 * Google Gemini AI Service
 *
 * Service for integrating with Google Gemini 2.5 Flash Lite API
 * Used for AI-powered summarization and content generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Initialize Gemini AI client
 * Uses API key from environment variable
 */
const initGemini = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * Summarize session notes into key highlights and challenges
 *
 * @param {string} sessionNotes - Raw session notes from training events
 * @param {object} attendanceData - Optional attendance data for the day
 * @param {number} attendanceData.present - Number of participants present
 * @param {number} attendanceData.late - Number of participants late
 * @param {number} attendanceData.absent - Number of participants absent
 * @param {number} attendanceData.total - Total number of participants
 * @param {string[]} attendanceData.absentNames - Names of absent participants
 * @param {object[]} parkingLotItems - Optional parking lot items (issues/questions)
 * @param {string} parkingLotItems[].type - Item type (issue or question)
 * @param {string} parkingLotItems[].title - Item title
 * @param {string} parkingLotItems[].priority - Item priority (low, medium, high)
 * @param {string} parkingLotItems[].status - Item status (open, in_progress, resolved)
 * @param {object} options - Optional AI settings
 * @param {string} options.tone - Tone preset: 'natural', 'formal', 'executive', or 'custom'
 * @param {string} options.customTone - Custom tone description (used when tone is 'custom')
 * @param {string} options.language - Output language code: 'auto', 'en', 'fr', 'es', 'pt', 'de'
 * @returns {Promise<{keyHighlights: string[], challenges: string[]}>}
 */
export const summarizeSessionNotes = async (sessionNotes, attendanceData = null, parkingLotItems = null, options = {}) => {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Build attendance context if available
    let attendanceContext = '';
    if (attendanceData && attendanceData.total > 0) {
      const attendanceRate = Math.round(((attendanceData.present + attendanceData.late) / attendanceData.total) * 100);
      attendanceContext = `
Attendance Data:
- Total Participants: ${attendanceData.total}
- Present: ${attendanceData.present}
- Late: ${attendanceData.late}
- Absent: ${attendanceData.absent}
- Attendance Rate: ${attendanceRate}%
${attendanceData.absentNames && attendanceData.absentNames.length > 0 ? `- Absent Participants: ${attendanceData.absentNames.join(', ')}` : ''}
`;
    }

    // Build parking lot context if available
    let parkingLotContext = '';
    if (parkingLotItems && parkingLotItems.length > 0) {
      const openItems = parkingLotItems.filter(item => item.status !== 'resolved');
      const issues = openItems.filter(item => item.type === 'issue');
      const questions = openItems.filter(item => item.type === 'question');
      const highPriorityItems = openItems.filter(item => item.priority === 'high');

      parkingLotContext = `
Parking Lot Items (Open Issues & Questions):
- Total Open Items: ${openItems.length}
- Issues: ${issues.length}
- Questions: ${questions.length}
- High Priority Items: ${highPriorityItems.length}
${issues.length > 0 ? `\nOpen Issues:\n${issues.map(i => `  - [${i.priority}] ${i.title}`).join('\n')}` : ''}
${questions.length > 0 ? `\nOpen Questions:\n${questions.map(i => `  - [${i.priority}] ${i.title}`).join('\n')}` : ''}
`;
    }

    const hasParkingLot = parkingLotItems && parkingLotItems.length > 0;
    const hasAttendance = attendanceData && attendanceData.total > 0;

    // Build tone instruction
    const { tone = 'natural', customTone = '', language = 'auto' } = options;
    let toneInstruction = '';
    switch (tone) {
      case 'executive':
        toneInstruction = '\nTone: Use an executive briefing tone — concise, high-level, action-oriented, suitable for C-suite stakeholders.';
        break;
      case 'formal':
        toneInstruction = '\nTone: Use a formal, professional tone suitable for official reports and documentation.';
        break;
      case 'custom':
        if (customTone.trim()) {
          toneInstruction = `\nTone: Use the following tone: ${customTone.trim()}`;
        }
        break;
      case 'natural':
      default:
        toneInstruction = '\nTone: Use a natural, conversational yet professional tone.';
        break;
    }

    // Build language instruction
    const languageNames = { fr: 'French', es: 'Spanish', pt: 'Portuguese', de: 'German' };
    let languageInstruction = '';
    if (language && language !== 'auto' && language !== 'en' && languageNames[language]) {
      languageInstruction = `\nIMPORTANT: Write your entire response in ${languageNames[language]}. All highlights and challenges must be in ${languageNames[language]}.`;
    }

    const prompt = `You are an expert training analyst. Analyze the following training session notes${hasAttendance ? ', attendance data' : ''}${hasParkingLot ? ', and parking lot items' : ''} and extract:${toneInstruction}${languageInstruction}

1. Key Highlights: 3-5 positive outcomes, achievements, or important observations from the training
2. Challenges: 2-4 obstacles, issues, or areas that need improvement
${hasAttendance ? '\nIMPORTANT: Include attendance-related insights in your analysis. If attendance was good, mention it as a highlight. If there were absences or late arrivals, mention them as challenges with the names of absent participants if provided.' : ''}
${hasParkingLot ? '\nIMPORTANT: Include relevant parking lot items in your analysis. Open issues and unanswered questions should be reflected in the challenges section. High priority items should be emphasized.' : ''}
${attendanceContext}${parkingLotContext}
Session Notes:
${sessionNotes}

Please respond in JSON format with this exact structure:
{
  "keyHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "challenges": ["challenge 1", "challenge 2"]
}

Guidelines:
- Be concise and specific
- Focus on actionable insights
- Use complete sentences
- Order highlights and challenges chronologically, following the sequence of events in the session notes
- Ensure highlights are positive and challenges are constructive
${hasAttendance ? '- Include attendance insights when relevant (e.g., "Excellent attendance with all participants present" or "3 participants were absent: John, Jane, Bob - follow-up required")' : ''}
${hasParkingLot ? '- Include parking lot insights when relevant (e.g., "Several open questions need to be addressed" or "High priority issue: [issue title] requires immediate attention")' : ''}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract token usage metadata from response
    const usageMetadata = response.usageMetadata || {};
    const tokenUsage = {
      inputTokens: usageMetadata.promptTokenCount || null,
      outputTokens: usageMetadata.candidatesTokenCount || null,
      totalTokens: usageMetadata.totalTokenCount || null
    };

    // Parse JSON response, handling potential markdown formatting
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Try to extract JSON if it's embedded in other text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.warn('[Gemini AI] Failed to parse JSON, using fallback. Raw text:', jsonText.slice(0, 200));
      // Gemini sometimes returns conversational text instead of JSON
      // (e.g. when notes are too short). Return a helpful fallback.
      parsed = {
        keyHighlights: ['Session notes recorded — add more detail for richer AI insights'],
        challenges: ['Notes were too brief for a full analysis — try adding more context']
      };
    }

    // Validate response structure
    if (!parsed.keyHighlights || !Array.isArray(parsed.keyHighlights)) {
      throw new Error('Invalid response: keyHighlights must be an array');
    }
    if (!parsed.challenges || !Array.isArray(parsed.challenges)) {
      throw new Error('Invalid response: challenges must be an array');
    }

    return {
      keyHighlights: parsed.keyHighlights,
      challenges: parsed.challenges,
      tokenUsage
    };

  } catch (error) {
    console.error('[Gemini AI] Summarization error:', error);

    // Provide helpful user-friendly error messages
    if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      throw new Error('AI service is not configured. Please contact your administrator.');
    }
    if (error.message?.includes('quota') || error.message?.includes('QUOTA')) {
      throw new Error('AI service quota exceeded. Please try again later.');
    }
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      throw new Error('AI service is temporarily unavailable. The AI model may be updating. Please try again in a few minutes.');
    }
    if (error.message?.includes('403') || error.message?.includes('permission') || error.message?.includes('Permission')) {
      throw new Error('AI service access denied. Please contact your administrator to verify API configuration.');
    }
    if (error.message?.includes('429') || error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    if (error.message?.includes('500') || error.message?.includes('503') || error.message?.includes('Internal')) {
      throw new Error('AI service is experiencing issues. Please try again in a few minutes.');
    }
    if (error.message?.includes('timeout') || error.message?.includes('Timeout') || error.message?.includes('TIMEOUT')) {
      throw new Error('AI request timed out. Please try again with shorter session notes.');
    }
    if (error.message?.includes('network') || error.message?.includes('Network') || error.message?.includes('ECONNREFUSED')) {
      throw new Error('Unable to connect to AI service. Please check your internet connection.');
    }

    // Generic fallback - don't expose technical details
    throw new Error('Unable to generate summary. Please try again or contact support if the issue persists.');
  }
};

/**
 * Test Gemini AI connection
 *
 * @returns {Promise<boolean>}
 */
export const testGeminiConnection = async () => {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const result = await model.generateContent('Hello, respond with "OK"');
    const response = await result.response;
    const text = response.text();

    return text.includes('OK');
  } catch (error) {
    console.error('[Gemini AI] Connection test failed:', error);
    return false;
  }
};

export default {
  summarizeSessionNotes,
  testGeminiConnection
};
