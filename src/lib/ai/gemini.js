/**
 * Google Gemini AI Service
 *
 * Service for integrating with Google Gemini 1.5 Flash API
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
 * @returns {Promise<{keyHighlights: string[], challenges: string[]}>}
 */
export const summarizeSessionNotes = async (sessionNotes) => {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert training analyst. Analyze the following training session notes and extract:

1. Key Highlights: 3-5 positive outcomes, achievements, or important observations from the training
2. Challenges: 2-4 obstacles, issues, or areas that need improvement

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
- Prioritize the most important items
- Ensure highlights are positive and challenges are constructive`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
      console.error('[Gemini AI] Failed to parse JSON:', jsonText);
      console.error('[Gemini AI] Parse error:', parseError);
      throw new Error('AI returned invalid JSON format. Please try again.');
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
      challenges: parsed.challenges
    };

  } catch (error) {
    console.error('[Gemini AI] Summarization error:', error);

    // Provide helpful error messages
    if (error.message?.includes('API key')) {
      throw new Error('AI service is not configured. Please contact administrator.');
    }
    if (error.message?.includes('quota')) {
      throw new Error('AI service quota exceeded. Please try again later.');
    }

    throw new Error(`AI summarization failed: ${error.message}`);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
