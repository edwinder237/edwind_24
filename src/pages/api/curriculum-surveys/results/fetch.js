import prisma from "../../../../lib/prisma";
import { google } from 'googleapis';

/**
 * Fetch survey results from external providers
 * Currently supports: Google Forms API
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { surveyId } = req.query;

    if (!surveyId) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID is required'
      });
    }

    // Get survey details
    const survey = await prisma.curriculum_surveys.findUnique({
      where: { id: parseInt(surveyId) }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Route to appropriate provider
    let results;
    switch (survey.provider) {
      case 'google_forms':
        results = await fetchGoogleFormsResults(survey.providerConfig);
        break;
      case 'typeform':
        results = await fetchTypeformResults(survey.providerConfig);
        break;
      default:
        results = {
          success: false,
          error: `Results fetching not supported for provider: ${survey.provider}. View results directly in the survey tool.`,
          responses: [],
          questions: []
        };
    }

    res.status(200).json({
      success: results.success,
      survey: {
        id: survey.id,
        title: survey.title,
        provider: survey.provider
      },
      ...results
    });
  } catch (error) {
    console.error('Error fetching survey results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey results',
      error: error.message
    });
  }
}

/**
 * Extract form ID from Google Forms URL
 *
 * Important: Google Forms has two types of URLs:
 * 1. Edit URL: https://docs.google.com/forms/d/{FORM_ID}/edit - This is the actual form ID needed for API
 * 2. Published URL: https://docs.google.com/forms/d/e/{PUBLISHED_ID}/viewform - This is NOT the form ID
 *
 * The API requires the form ID from the edit URL, not the published ID.
 */
function extractGoogleFormId(formUrl) {
  if (!formUrl) return null;

  try {
    const url = new URL(formUrl);
    const pathParts = url.pathname.split('/');

    const dIndex = pathParts.indexOf('d');
    if (dIndex !== -1 && pathParts[dIndex + 1]) {
      const nextPart = pathParts[dIndex + 1];

      // If URL contains /d/e/, this is a published form URL (not usable with API)
      if (nextPart === 'e') {
        // Return null to indicate we need the edit URL instead
        return { error: 'published_url', publishedId: pathParts[dIndex + 2] };
      }

      // This is the actual form ID from an edit URL
      return { formId: nextPart };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch results from Google Forms API
 */
async function fetchGoogleFormsResults(config) {
  const extractResult = extractGoogleFormId(config?.formUrl);

  if (!extractResult) {
    return {
      success: false,
      error: 'Could not extract form ID from URL. Please provide a valid Google Forms URL.',
      responses: [],
      questions: []
    };
  }

  // Check if user provided a published URL instead of edit URL
  if (extractResult.error === 'published_url') {
    return {
      success: false,
      error: 'You provided a published/sharing form URL. The Google Forms API requires the edit URL instead.',
      responses: [],
      questions: [],
      setupInstructions: [
        '1. Open your Google Form in edit mode',
        '2. Copy the URL from the browser address bar (it should look like: https://docs.google.com/forms/d/XXXXX/edit)',
        '3. Update the survey with this edit URL instead of the sharing/viewform URL',
        '4. Make sure to share the form with the service account email'
      ]
    };
  }

  const formId = extractResult.formId;

  // Check for service account credentials
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    return {
      success: false,
      error: 'Google service account not configured. Add GOOGLE_SERVICE_ACCOUNT_KEY to environment variables.',
      responses: [],
      questions: [],
      formId,
      setupInstructions: [
        '1. Create a Google Cloud project at console.cloud.google.com',
        '2. Enable the Google Forms API',
        '3. Create a service account with Forms API access',
        '4. Download the JSON key file',
        '5. Add the entire JSON content as GOOGLE_SERVICE_ACCOUNT_KEY in your .env file',
        '6. Share your Google Form with the service account email (view access)'
      ]
    };
  }

  try {
    // Parse service account credentials
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch {
      return {
        success: false,
        error: 'Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Must be valid JSON.',
        responses: [],
        questions: []
      };
    }

    // Create auth client with both scopes needed for form structure and responses
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/forms.body.readonly',
        'https://www.googleapis.com/auth/forms.responses.readonly'
      ]
    });

    const forms = google.forms({ version: 'v1', auth });

    // Fetch form structure (questions)
    let formData;
    try {
      const formResponse = await forms.forms.get({ formId });
      formData = formResponse.data;
    } catch (formError) {
      if (formError.code === 403) {
        return {
          success: false,
          error: `Access denied. Share the form with your service account email: ${credentials.client_email}`,
          responses: [],
          questions: [],
          serviceAccountEmail: credentials.client_email
        };
      }
      if (formError.code === 404) {
        return {
          success: false,
          error: 'Form not found. Check that the form URL is correct.',
          responses: [],
          questions: []
        };
      }
      throw formError;
    }

    // Extract questions from form
    const questions = extractQuestionsFromForm(formData);

    // Fetch responses
    let responsesData;
    try {
      const responsesResponse = await forms.forms.responses.list({ formId });
      responsesData = responsesResponse.data.responses || [];
    } catch (respError) {
      // If we can get the form but not responses, that's still useful info
      return {
        success: true,
        formTitle: formData.info?.title,
        questions,
        responses: [],
        responseCount: 0,
        error: 'Could not fetch responses. The form may have no responses yet.',
        canAccessForm: true,
        canAccessResponses: false
      };
    }

    // Get custom answer key from config (if provided)
    const customAnswerKey = config?.answerKey || {};

    // Transform responses with grading
    const responses = responsesData.map(response => transformGoogleFormResponse(response, questions, customAnswerKey));

    // Check if this form has grading (quiz mode or custom answer key)
    const hasGrading = questions.some(q => q.correctAnswers) || Object.keys(customAnswerKey).length > 0;

    return {
      success: true,
      formTitle: formData.info?.title,
      formDescription: formData.info?.description,
      questions,
      responses,
      responseCount: responses.length,
      lastResponseTime: responses.length > 0 ? responses[responses.length - 1].submittedAt : null,
      hasGrading,
      isQuizMode: questions.some(q => q.correctAnswers),
      hasCustomAnswerKey: Object.keys(customAnswerKey).length > 0
    };

  } catch (error) {
    console.error('Google Forms API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch from Google Forms API',
      responses: [],
      questions: []
    };
  }
}

/**
 * Extract questions from Google Form data, including correct answers if quiz mode
 */
function extractQuestionsFromForm(formData) {
  if (!formData.items) return [];

  return formData.items
    .filter(item => item.questionItem) // Only include question items
    .map(item => {
      const question = item.questionItem.question;
      const questionId = question.questionId;

      let questionType = 'unknown';
      let options = [];
      let correctAnswers = null;
      let pointValue = null;

      if (question.textQuestion) {
        questionType = question.textQuestion.paragraph ? 'paragraph' : 'short_text';
      } else if (question.choiceQuestion) {
        questionType = question.choiceQuestion.type === 'CHECKBOX' ? 'checkbox' : 'multiple_choice';
        options = question.choiceQuestion.options?.map(opt => opt.value) || [];
      } else if (question.scaleQuestion) {
        questionType = 'scale';
        options = {
          low: question.scaleQuestion.low,
          high: question.scaleQuestion.high,
          lowLabel: question.scaleQuestion.lowLabel,
          highLabel: question.scaleQuestion.highLabel
        };
      } else if (question.dateQuestion) {
        questionType = 'date';
      } else if (question.timeQuestion) {
        questionType = 'time';
      }

      // Extract grading info if this is a quiz (Google Forms quiz mode)
      if (question.grading) {
        pointValue = question.grading.pointValue;
        if (question.grading.correctAnswers?.answers) {
          correctAnswers = question.grading.correctAnswers.answers.map(a => a.value);
        }
      }

      return {
        id: questionId,
        title: item.title,
        description: item.description,
        type: questionType,
        required: question.required || false,
        options,
        correctAnswers,
        pointValue
      };
    });
}

/**
 * Transform a Google Form response into our format with grading
 */
function transformGoogleFormResponse(response, questions, customAnswerKey = {}) {
  const answers = {};
  const grading = {};
  let totalScore = 0;
  let maxScore = 0;

  if (response.answers) {
    Object.entries(response.answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      const questionTitle = question?.title || questionId;

      if (answer.textAnswers) {
        const values = answer.textAnswers.answers.map(a => a.value);
        const answerValue = values.length === 1 ? values[0] : values;
        answers[questionTitle] = answerValue;

        // Check if there's a correct answer (from quiz mode or custom key)
        const correctAnswers = question?.correctAnswers || customAnswerKey[questionTitle];
        if (correctAnswers) {
          const isCorrect = checkAnswerCorrect(answerValue, correctAnswers);
          const pointValue = question?.pointValue || 1;
          maxScore += pointValue;

          grading[questionTitle] = {
            isCorrect,
            correctAnswers,
            pointsEarned: isCorrect ? pointValue : 0,
            pointValue
          };

          if (isCorrect) {
            totalScore += pointValue;
          }
        }
      }
    });
  }

  // Add points for unanswered questions with point values
  questions.forEach(q => {
    if (q.pointValue && !grading[q.title]) {
      maxScore += q.pointValue;
    }
  });

  return {
    responseId: response.responseId,
    submittedAt: response.lastSubmittedTime || response.createTime,
    respondentEmail: response.respondentEmail || null,
    answers,
    grading: Object.keys(grading).length > 0 ? grading : null,
    score: maxScore > 0 ? { earned: totalScore, max: maxScore, percentage: Math.round((totalScore / maxScore) * 100) } : null
  };
}

/**
 * Check if an answer is correct
 */
function checkAnswerCorrect(answer, correctAnswers) {
  if (!correctAnswers || correctAnswers.length === 0) return null;

  // Normalize to arrays for comparison
  const answerArray = Array.isArray(answer) ? answer : [answer];
  const correctArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  // For checkboxes/multiple select: all correct answers must be selected
  if (answerArray.length !== correctArray.length) return false;

  // Sort and compare
  const sortedAnswer = [...answerArray].sort();
  const sortedCorrect = [...correctArray].sort();

  return sortedAnswer.every((val, idx) =>
    val.toLowerCase().trim() === sortedCorrect[idx].toLowerCase().trim()
  );
}

/**
 * Fetch results from Typeform API
 */
async function fetchTypeformResults(config) {
  if (!config?.apiKey) {
    return {
      success: false,
      error: 'Typeform API key required to fetch responses',
      responses: [],
      questions: []
    };
  }

  const formId = extractTypeformId(config.formUrl);
  if (!formId) {
    return {
      success: false,
      error: 'Could not extract form ID from Typeform URL',
      responses: [],
      questions: []
    };
  }

  try {
    // Fetch form structure
    const formResponse = await fetch(`https://api.typeform.com/forms/${formId}`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });

    if (!formResponse.ok) {
      throw new Error(`Typeform API error: ${formResponse.status}`);
    }

    const formData = await formResponse.json();

    // Extract questions
    const questions = formData.fields?.map(field => ({
      id: field.id,
      title: field.title,
      type: field.type,
      required: field.validations?.required || false,
      options: field.properties?.choices?.map(c => c.label) || []
    })) || [];

    // Fetch responses
    const responsesResponse = await fetch(`https://api.typeform.com/forms/${formId}/responses`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });

    if (!responsesResponse.ok) {
      throw new Error(`Typeform API error: ${responsesResponse.status}`);
    }

    const responsesData = await responsesResponse.json();

    // Transform responses
    const responses = responsesData.items?.map(item => {
      const answers = {};
      item.answers?.forEach(answer => {
        const question = questions.find(q => q.id === answer.field.id);
        const questionTitle = question?.title || answer.field.id;

        // Handle different answer types
        if (answer.type === 'choice') {
          answers[questionTitle] = answer.choice?.label;
        } else if (answer.type === 'choices') {
          answers[questionTitle] = answer.choices?.labels;
        } else if (answer.type === 'text' || answer.type === 'email') {
          answers[questionTitle] = answer[answer.type];
        } else if (answer.type === 'number') {
          answers[questionTitle] = answer.number;
        } else if (answer.type === 'boolean') {
          answers[questionTitle] = answer.boolean;
        } else if (answer.type === 'date') {
          answers[questionTitle] = answer.date;
        }
      });

      return {
        responseId: item.response_id,
        submittedAt: item.submitted_at,
        answers
      };
    }) || [];

    return {
      success: true,
      formTitle: formData.title,
      questions,
      responses,
      responseCount: responsesData.total_items || responses.length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      responses: [],
      questions: []
    };
  }
}

function extractTypeformId(formUrl) {
  if (!formUrl) return null;
  try {
    const url = new URL(formUrl);
    const pathParts = url.pathname.split('/');
    const toIndex = pathParts.indexOf('to');
    if (toIndex !== -1 && pathParts[toIndex + 1]) {
      return pathParts[toIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}
