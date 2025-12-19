// Gemini AI Service - generates vocabulary learning content
// Requires GEMINI_API_KEY in .env

import { GoogleGenAI, Type } from '@google/genai';

// --- Setup ---

const ai = new GoogleGenAI({});
const MODEL = 'gemini-2.0-flash';

// Set to true for console logs, or use DEBUG_AI=true in env
const DEBUG_MODE = process.env.DEBUG_AI === 'true' || true;

// --- Debug logging ---

function logStep(stepNumber, title, input, output) {
  if (!DEBUG_MODE) return;
  console.log(`\n[Step ${stepNumber}] ${title}`);
  console.log('  Input:', input);
  console.log('  Output:', output);
}

function logStart(functionName, params) {
  if (!DEBUG_MODE) return;
  console.log(`\n--- ${functionName} ---`);
  console.log('Parameters:', params);
}

function logResult(functionName, result) {
  if (!DEBUG_MODE) return;
  const status = result.success ? 'SUCCESS' : 'FAILED';
  console.log(`\n[${status}] ${functionName}`);
  console.log('Result:', JSON.stringify(result, null, 2));
}

// --- Main function ---

// Returns word info: translation, partOfSpeech, definition, exampleSentences
export async function generateWordInfo(word, options = {}) {
  const { targetLanguage, nativeLanguage, interests } = options;

  logStart('generateWordInfo', { word, targetLanguage, nativeLanguage, interests });

  const prompt = buildPromptForWord(word, targetLanguage);
  logStep(1, 'Building prompt', { word, targetLanguage }, prompt);

  const systemInstruction = buildSystemInstructions({ targetLanguage, nativeLanguage, interests });
  logStep(2, 'Building instructions', { targetLanguage, nativeLanguage, interests: interests || '(none)' }, systemInstruction.substring(0, 100) + '...');

  const responseSchema = buildWordInfoSchema(nativeLanguage);
  logStep(3, 'Defining schema', { nativeLanguage }, `Fields: ${Object.keys(responseSchema.properties).join(', ')}`);

  const geminiResponse = await askGemini({ prompt, systemInstruction, responseSchema });
  logStep(4, 'Gemini response', { prompt: prompt.substring(0, 50) + '...' },
    geminiResponse.error ? `ERROR: ${geminiResponse.error}` : `JSON (${geminiResponse.text.length} chars)`
  );

  if (geminiResponse.error) {
    const errorResult = buildErrorResult(word, geminiResponse.error);
    logResult('generateWordInfo', errorResult);
    return errorResult;
  }

  const wordInfo = parseJsonResponse(geminiResponse.text);
  logStep(5, 'Parsing JSON', `"${geminiResponse.text.substring(0, 50)}..."`,
    wordInfo ? { word: wordInfo.word, translation: wordInfo.translation } : 'FAILED'
  );

  if (!wordInfo) {
    const errorResult = buildErrorResult(word, 'Failed to parse AI response');
    logResult('generateWordInfo', errorResult);
    return errorResult;
  }

  const result = buildSuccessResult(wordInfo);
  logStep(6, 'Success', { wordInfo: '(object)' }, { success: true });
  logResult('generateWordInfo', result);
  return result;
}

// --- Step 1: Build prompt ---

function buildPromptForWord(word, targetLanguage) {
  if (targetLanguage) {
    return `Provide information about the ${targetLanguage} word "${word}"`;
  }
  return `Provide information about the word "${word}"`;
}

// --- Step 2: Build system instructions ---

function buildSystemInstructions({ targetLanguage, nativeLanguage, interests }) {
  let instructions = 'You are a language learning assistant helping someone learn vocabulary.';
  instructions += buildLanguageContext(targetLanguage, nativeLanguage);
  instructions += buildInterestsContext(interests);
  instructions += '\nReturn ONLY the JSON response, nothing else.';
  return instructions;
}

function buildLanguageContext(targetLanguage, nativeLanguage) {
  if (targetLanguage && nativeLanguage) {
    return `\nThe learner is studying ${targetLanguage} and their native language is ${nativeLanguage}.\nProvide the translation in ${nativeLanguage}.`;
  }
  return '';
}

function buildInterestsContext(interests) {
  if (interests && interests.trim()) {
    return `\n\nIMPORTANT: The learner is interested in: ${interests}.\nCreate example sentences that reference these interests to make learning more memorable and personal.\nFor example, if they like "Shrek", use Shrek characters or scenarios in the examples.`;
  }
  return '\n\nCreate 2 simple, relatable example sentences using the word.';
}

// --- Step 3: Define schema ---

// Schema tells Gemini to return structured JSON instead of plain text
function buildWordInfoSchema(nativeLanguage = 'English') {
  return {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING, description: 'The original word' },
      translation: { type: Type.STRING, description: `Translation in ${nativeLanguage}` },
      partOfSpeech: { type: Type.STRING, description: 'noun, verb, adjective, etc.' },
      definition: { type: Type.STRING, description: 'Clear definition in English' },
      exampleSentences: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Two example sentences' }
    },
    required: ['word', 'translation', 'partOfSpeech', 'definition', 'exampleSentences']
  };
}

// --- Step 4: Ask Gemini ---

// Sends request to Gemini, returns { text } or { error }
async function askGemini({ prompt, systemInstruction, responseSchema }) {
  if (DEBUG_MODE) console.log('\n  Sending request to Gemini...');

  try {
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema
      }
    });
    const duration = Date.now() - startTime;

    if (DEBUG_MODE) console.log(`  Response received in ${duration}ms (${response.text.length} chars)`);

    // response.text is a JSON string, needs parsing
    return { text: response.text };
  } catch (error) {
    if (DEBUG_MODE) console.log(`  API Error: ${error.message || error}`);
    console.error('Gemini API error:', error);
    return { error: convertErrorToMessage(error) };
  }
}

// --- Step 5: Parse response ---

// Converts JSON string to object
function parseJsonResponse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    return null;
  }
}

// --- Step 6: Build results ---

function buildSuccessResult(wordInfo) {
  return { success: true, wordInfo };
}

function buildErrorResult(word, errorMessage) {
  return { success: false, word, error: errorMessage };
}

// --- Error handling ---

// Converts HTTP errors to user-friendly messages
function convertErrorToMessage(error) {
  const statusMessages = {
    400: 'Invalid request. Please try a different word.',
    401: 'API authentication failed. Please check configuration.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'AI service temporarily unavailable. Please try again later.',
    503: 'AI service temporarily unavailable. Please try again later.'
  };

  if (error.status && statusMessages[error.status]) {
    return statusMessages[error.status];
  }
  return error.message || 'An unexpected error occurred.';
}

// --- Other functions ---

// Check if Gemini API is available
export async function checkApiAvailability() {
  if (!process.env.GEMINI_API_KEY) return false;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: 'Say "OK" if you can hear me.',
      config: { temperature: 0 }
    });
    return response.text.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}

// --- Export ---

export default {
  generateWordInfo,
  checkApiAvailability
};
