/**
 * ADK API client for the Weekend Planner frontend.
 * Implements communication with the ADK backend using native fetch API.
 * 
 * Uses two-step session-based flow per Google ADK conventions:
 * 1. Create session with empty body POST to /apps/{app}/users/{user}/sessions/{session}
 * 2. Send message with new_message payload to the same endpoint
 */

import type { GeneratePlanInput, ADKResponse, GeneratePlanResult, ADKEvent, PlanError } from '../types';

/** API base URL from environment or default */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Default timeout for API requests (30 seconds) */
const REQUEST_TIMEOUT_MS = 30000;

/** Default app name for ADK */
const APP_NAME = 'WeekendPlanner';

/** Default user ID for ADK sessions - static per requirements */
const DEFAULT_USER_ID = 'user-1';

/**
 * Creates a new ADK session.
 * @param userId - The user ID for the session (defaults to 'user-1')
 * @param sessionId - The session ID (generated via crypto.randomUUID() if not provided)
 * @returns Promise resolving to the session ID on success
 * @throws Error if session creation fails
 */
export async function createSession(
  userId: string = DEFAULT_USER_ID,
  sessionId?: string
): Promise<string> {
  const sid = sessionId || crypto.randomUUID();
  const url = `${API_BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sid}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Session creation failed with status ${response.status}`);
    }

    return sid;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Session creation timed out');
    }
    
    throw error;
  }
}

/**
 * Builds the prompt string from input data.
 * Constructs a simple prompt with zip code and optional kids ages.
 * 
 * @param input - The user's input data
 * @returns The formatted prompt string
 */
function buildPrompt(input: GeneratePlanInput): string {
  let prompt = `Plan a weekend trip for zip code ${input.location}.`;

  // kidsAges is now number[] - check length for presence of ages
  if (input.kidsAges && input.kidsAges.length > 0) {
    prompt += ` We have kids ages ${input.kidsAges.join(', ')}.`;
  }

  return prompt;
}

/**
 * Extracts plan text from ADK response events.
 * Prioritizes the final_summary from the SummarizerAgent, falling back to
 * the last model response if no specific summary is found.
 * 
 * @param response - Array of ADK events from the ADK endpoint
 * @returns Extracted plan text or undefined if not found
 */
function extractPlanText(response: ADKResponse): string | undefined {
  if (!response || response.length === 0) {
    return undefined;
  }

  // First, look for events that might be the final summary
  // The SummarizerAgent outputs to 'final_summary' key
  // These events typically have author containing 'SummarizerAgent' or 'model'
  const summarizerEvents: ADKEvent[] = response.filter(
    (event: ADKEvent) => 
      (event.author === 'SummarizerAgent' || event.author.includes('Summarizer')) &&
      event.content?.parts
  );

  // If we found summarizer events, extract text from them
  if (summarizerEvents.length > 0) {
    const textParts: string[] = [];
    for (const event of summarizerEvents) {
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) {
            textParts.push(part.text);
          }
        }
      }
    }
    if (textParts.length > 0) {
      return textParts.join('\n');
    }
  }

  // Fall back to finding model responses with content
  const modelEvents: ADKEvent[] = response.filter(
    (event: ADKEvent) => event.author === 'model' && event.content?.parts
  );

  // If we have model events, prefer the last one (most likely the final output)
  if (modelEvents.length > 0) {
    const lastModelEvent = modelEvents[modelEvents.length - 1];
    const textParts: string[] = [];
    
    if (lastModelEvent.content?.parts) {
      for (const part of lastModelEvent.content.parts) {
        if (part.text) {
          textParts.push(part.text);
        }
      }
    }
    
    if (textParts.length > 0) {
      return textParts.join('\n');
    }
  }

  // Last resort: collect all text from any events with content
  const allTextParts: string[] = [];
  for (const event of response) {
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if (part.text) {
          allTextParts.push(part.text);
        }
      }
    }
  }

  return allTextParts.length > 0 ? allTextParts.join('\n') : undefined;
}

/**
 * Generates a weekend plan using the ADK backend.
 * Implements two-step session-based flow per Google ADK conventions:
 * 1. Create session with empty body POST
 * 2. Send message with new_message payload
 * 
 * @param input - The user's input data for plan generation
 * @returns Promise resolving to the plan result
 */
export async function generatePlan(
  input: GeneratePlanInput
): Promise<GeneratePlanResult> {
  // Generate unique session ID client-side using crypto.randomUUID()
  const sessionId = crypto.randomUUID();
  const userId = DEFAULT_USER_ID;
  const url = `${API_BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Step 1: Create session with empty body
    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}),
      signal: controller.signal
    });

    if (!createResponse.ok) {
      clearTimeout(timeoutId);
      const errorBody = await createResponse.text().catch(() => '');
      return {
        success: false,
        error: {
          message: `Session creation failed with status ${createResponse.status}`,
          statusCode: createResponse.status,
          body: errorBody
        }
      };
    }

    // Step 2: Send message with new_message payload to the same endpoint
    const messageResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_message: {
          role: 'user',
          parts: [{ text: buildPrompt(input) }]
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!messageResponse.ok) {
      const errorBody = await messageResponse.text().catch(() => '');
      const error: PlanError = {
        message: getErrorMessage(messageResponse.status, errorBody),
        statusCode: messageResponse.status,
        body: errorBody
      };

      return {
        success: false,
        error
      };
    }

    let data: ADKResponse;
    try {
      data = await messageResponse.json();
    } catch {
      return {
        success: false,
        error: {
          message: 'Received an unexpected response format',
          statusCode: messageResponse.status
        }
      };
    }

    const planText = extractPlanText(data);

    return {
      success: true,
      planText,
      rawResponse: data
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            message: 'Request timed out. Please try again.'
          }
        };
      }

      // Network error or CORS issue
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          success: false,
          error: {
            message: "Couldn't reach the backend. Make sure the ADK server is running with `adk web`"
          }
        };
      }

      // TypeError typically indicates CORS blocking
      if (error instanceof TypeError) {
        return {
          success: false,
          error: {
            message: 'Connection blocked. See README for proxy setup.'
          }
        };
      }
    }

    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    };
  }
}

/**
 * Gets a user-friendly error message based on status code.
 * @param statusCode - HTTP status code
 * @param body - Response body (if available)
 * @returns User-friendly error message
 */
function getErrorMessage(statusCode: number, body?: string): string {
  if (statusCode >= 400 && statusCode < 500) {
    // Try to extract error details from body
    try {
      const parsed = JSON.parse(body || '{}');
      if (parsed.detail || parsed.message || parsed.error) {
        return `Invalid request: ${parsed.detail || parsed.message || parsed.error}`;
      }
    } catch {
      // Ignore JSON parse errors
    }
    return `Invalid request: ${body || 'Unknown client error'}`;
  }

  if (statusCode >= 500) {
    return 'Something went wrong on the server. Please try again.';
  }

  return `Request failed with status ${statusCode}`;
}
