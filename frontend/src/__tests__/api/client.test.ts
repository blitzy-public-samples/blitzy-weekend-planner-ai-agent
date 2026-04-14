/**
 * Unit tests for the session-based ADK API client (frontend/src/api/client.ts).
 *
 * This test file contains comprehensive test cases covering the two-step session-based
 * API flow: first creating a session, then sending a message with new_message payload.
 * Tests use MSW (Mock Service Worker) for API mocking to run without requiring the
 * actual ADK backend server.
 *
 * Test Coverage:
 * - generatePlan() creates session then sends message with valid response parsing
 * - generatePlan() generates unique session ID using crypto.randomUUID()
 * - generatePlan() sends correct new_message payload format
 * - generatePlan() 30-second timeout handling using AbortController
 * - generatePlan() 400 Bad Request error handling with structured errors
 * - generatePlan() 500 Internal Server Error handling
 * - generatePlan() malformed JSON response handling
 * - createSession() successful session creation
 * - createSession() session creation failure scenarios
 *
 * Stryker mutation-testing targeted tests for:
 * - buildPrompt() string construction and conditional logic
 * - parseSSEResponse() SSE line parsing and JSON extraction
 * - extractPlanText() author-priority event filtering
 * - getErrorMessage() status code classification
 * - generatePlan() error path handling
 *
 * @module __tests__/api/client.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__mocks__/handlers';
import { createSession, generatePlan } from '../../api/client';
import type { GeneratePlanInput } from '../../types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats an array of ADK events as a Server-Sent Events (SSE) response string.
 * The /run_sse endpoint returns responses in this format.
 *
 * @param events - Array of event objects to format
 * @returns SSE-formatted string with each event prefixed by "data: "
 */
function formatAsSSE(events: unknown[]): string {
  return events.map(event => `data: ${JSON.stringify(event)}`).join('\n\n') + '\n\n';
}

// ============================================================================
// URL Pattern Constants
// ============================================================================

/**
 * Correct URL patterns matching the client's actual request URLs.
 * The client uses API_BASE_URL which defaults to 'http://localhost:8000' (no /api/ prefix).
 * The MSW default handlers in handlers.ts use '/api/...' prefix which does NOT match
 * the client's URLs in the test environment. These constants define the correct patterns
 * for test-level server.use() overrides.
 */
const SESSION_URL = 'http://localhost:8000/apps/WeekendPlanner/users/:userId/sessions/:sessionId';
const RUN_SSE_URL = 'http://localhost:8000/run_sse';

// ============================================================================
// Default Mock Data
// ============================================================================

/**
 * Default mock plan events used by the beforeEach success handler.
 * Provides a single model event with plan text for standard test cases.
 */
const defaultMockPlanEvents = [
  {
    id: 'evt-mock-001',
    timestamp: new Date().toISOString(),
    author: 'model',
    content: {
      role: 'model',
      parts: [{ text: '# Weekend Plan\n\nSample plan content for testing.' }]
    }
  }
];

// ============================================================================
// Test Data Constants
// ============================================================================

/**
 * Sample GeneratePlanInput with all fields populated.
 * Used for testing the standard success path.
 *
 * The form contains two fields:
 * - location (Zip Code): Required string
 * - kidsAges: Array of integers where 0 < age < 120
 */
const validInput: GeneratePlanInput = {
  location: '94105',
  kidsAges: [5, 8]
};

// ============================================================================
// Test Suite: API Client
// ============================================================================

describe('API Client', () => {
  /**
   * Register correct-URL handlers before each test.
   * The default handlers in handlers.ts use '/api/...' prefix which does not match
   * the client's actual URLs (http://localhost:8000/...). These overrides ensure
   * proper MSW request interception for the two-step session flow.
   */
  beforeEach(() => {
    server.use(
      http.post(SESSION_URL, () => {
        return HttpResponse.json({ status: 'created' }, { status: 200 });
      }),
      http.post(RUN_SSE_URL, () => {
        return new HttpResponse(formatAsSSE(defaultMockPlanEvents), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
        });
      })
    );
  });

  /**
   * Reset MSW handlers and restore mocks after each test to ensure test isolation.
   * This removes any runtime handlers added with server.use() during tests.
   */
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Test Suite: generatePlan()
  // ==========================================================================

  describe('generatePlan()', () => {
    /**
     * Test 1: Returns success with valid ADK response
     *
     * Verifies that generatePlan() correctly parses a valid ADK response array
     * and extracts the plan text from model author events.
     * The beforeEach hook provides the correct-URL success handlers.
     */
    it('returns success with valid ADK response', async () => {
      const result = await generatePlan(validInput);

      // Assert success state
      expect(result.success).toBe(true);

      // Assert plan text was extracted correctly
      expect(result.planText).toBeDefined();
      expect(typeof result.planText).toBe('string');
      expect(result.planText!.length).toBeGreaterThan(0);

      // Assert raw response is populated for debugging
      expect(result.rawResponse).toBeDefined();
      expect(Array.isArray(result.rawResponse)).toBe(true);
    });

    /**
     * Test 2: Handles 30-second timeout
     *
     * Verifies that generatePlan() properly implements request timeout handling
     * using AbortController. Since fake timers don't work well with MSW's async
     * handlers, we mock fetch directly to simulate an AbortError.
     */
    it('handles 30-second timeout', async () => {
      // Create an AbortError that properly inherits from Error
      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';

      // Mock fetch to reject with AbortError, simulating AbortController timeout
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(abortError) as typeof fetch;

      try {
        const result = await generatePlan(validInput);

        // Assert timeout error handling
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.message).toBe('Request timed out. Please try again.');
      } finally {
        // Restore original fetch
        globalThis.fetch = originalFetch;
      }
    });

    /**
     * Test 3: Handles 400 Bad Request with structured error
     *
     * Verifies that generatePlan() correctly handles 400 status responses
     * and extracts error details from the response body.
     * Session creation succeeds (via beforeEach), message sending returns 400.
     */
    it('handles 400 Bad Request with structured error', async () => {
      // Override only the run_sse handler to return 400 error
      // Session creation uses the beforeEach handler (200 OK)
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json(
            { error: 'Invalid input' },
            { status: 400 }
          );
        })
      );

      const result = await generatePlan(validInput);

      // Assert error state
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Assert error message contains "Invalid request" prefix
      expect(result.error!.message).toContain('Invalid request');

      // Assert status code is captured
      expect(result.error!.statusCode).toBe(400);
    });

    /**
     * Test 4: Handles 500 Internal Server Error
     *
     * Verifies that generatePlan() correctly handles 500 status responses
     * and provides a user-friendly error message.
     * Session creation succeeds (via beforeEach), message sending returns 500.
     */
    it('handles 500 Internal Server Error', async () => {
      // Override only the run_sse handler to return 500 error
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          );
        })
      );

      const result = await generatePlan(validInput);

      // Assert error state
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Assert user-friendly error message for server errors
      expect(result.error!.message).toBe('Something went wrong on the server. Please try again.');

      // Assert status code is captured
      expect(result.error!.statusCode).toBe(500);
    });

    /**
     * Test 5: Handles malformed JSON response
     *
     * Verifies that generatePlan() correctly handles responses that cannot
     * be parsed as valid JSON and provides an appropriate error message.
     * Session creation succeeds (via beforeEach), run_sse returns malformed data.
     */
    it('handles malformed JSON response', async () => {
      // Override only the run_sse handler to return malformed SSE data
      server.use(
        http.post(RUN_SSE_URL, () => {
          return new HttpResponse('data: not valid json {{{', {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      const result = await generatePlan(validInput);

      // Assert error state
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Assert specific error message for JSON parse failures
      expect(result.error!.message).toBe('Received an unexpected response format');
    });

    // ==========================================================================
    // Two-Step Session Flow Tests
    // ==========================================================================

    /**
     * Test 6: Creates session before sending plan request
     *
     * Verifies the two-step session flow is correctly implemented:
     * 1. First request creates session with empty body
     * 2. Second request sends plan request with new_message payload
     */
    it('creates session before sending plan request', async () => {
      const sessionRequests: { body: Record<string, unknown> | null }[] = [];
      const messageRequests: { body: Record<string, unknown> | null }[] = [];

      server.use(
        http.post(SESSION_URL, async ({ request }) => {
          let body: Record<string, unknown> | null = null;
          try {
            const text = await request.text();
            if (text && text.trim()) { body = JSON.parse(text); }
          } catch { body = null; }
          const isEmpty = !body || Object.keys(body).length === 0;
          sessionRequests.push({ body: isEmpty ? {} : body });
          return HttpResponse.json({ status: 'created' }, { status: 200 });
        }),
        http.post(RUN_SSE_URL, async ({ request }) => {
          let body: Record<string, unknown> | null = null;
          try {
            const text = await request.text();
            if (text && text.trim()) { body = JSON.parse(text); }
          } catch { body = null; }
          messageRequests.push({ body });
          return new HttpResponse(formatAsSSE(defaultMockPlanEvents), {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      await generatePlan(validInput);

      // Should have received 1 session creation request and 1 message request
      expect(sessionRequests.length).toBe(1);
      expect(messageRequests.length).toBe(1);

      // Session creation should have empty body
      expect(sessionRequests[0].body).toEqual({});

      // Message request should have new_message (plan generation)
      expect(messageRequests[0].body).toHaveProperty('new_message');
    });

    /**
     * Test 7: Generates unique session ID using crypto.randomUUID()
     *
     * Verifies that each call to generatePlan() generates a different
     * UUID-format session ID using crypto.randomUUID().
     */
    it('generates unique session ID using crypto.randomUUID()', async () => {
      const sessionIds: string[] = [];

      server.use(
        http.post(SESSION_URL, async ({ params }) => {
          sessionIds.push(params.sessionId as string);
          return HttpResponse.json({ status: 'created' }, { status: 200 });
        }),
        http.post(RUN_SSE_URL, () => {
          return new HttpResponse(formatAsSSE(defaultMockPlanEvents), {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      // Make two separate calls to generatePlan
      await generatePlan(validInput);
      await generatePlan(validInput);

      // Should have 2 unique session IDs (1 per call)
      const uniqueIds = [...new Set(sessionIds)];
      expect(uniqueIds.length).toBe(2);

      // Session IDs should be in UUID format (v4 UUID pattern)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uniqueIds[0]).toMatch(uuidRegex);
      expect(uniqueIds[1]).toMatch(uuidRegex);
    });

    /**
     * Test 8: Sends message with correct new_message payload format
     *
     * Verifies the new_message structure matches ADK requirements:
     * - Has 'role' property set to 'user'
     * - Has 'parts' array with text objects
     */
    it('sends message with correct new_message payload format', async () => {
      let capturedPayload: Record<string, unknown> | null = null;

      server.use(
        http.post(SESSION_URL, () => {
          return HttpResponse.json({ status: 'created' }, { status: 200 });
        }),
        http.post(RUN_SSE_URL, async ({ request }) => {
          let body: Record<string, unknown> | null = null;
          try {
            const text = await request.text();
            if (text && text.trim()) { body = JSON.parse(text); }
          } catch { body = null; }
          if (body && body.new_message) { capturedPayload = body; }
          return new HttpResponse(formatAsSSE(defaultMockPlanEvents), {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      await generatePlan(validInput);

      // Verify payload was captured
      expect(capturedPayload).not.toBeNull();

      // Verify new_message structure
      expect(capturedPayload).toHaveProperty('new_message');

      const newMessage = (capturedPayload as unknown as {
        new_message: { role: string; parts: Array<{ text: string }> }
      }).new_message;

      expect(newMessage).toHaveProperty('role', 'user');
      expect(newMessage).toHaveProperty('parts');
      expect(Array.isArray(newMessage.parts)).toBe(true);
      expect(newMessage.parts.length).toBeGreaterThan(0);
      expect(newMessage.parts[0]).toHaveProperty('text');
      expect(typeof newMessage.parts[0].text).toBe('string');

      // Verify the text contains relevant input information
      const messageText = newMessage.parts[0].text;
      expect(messageText.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Test Suite: createSession()
  // ==========================================================================

  describe('createSession()', () => {
    /**
     * Test 9: Creates session successfully
     *
     * Verifies that createSession() correctly creates an ADK session
     * and returns the session ID on success.
     * The beforeEach handler provides the correct-URL session endpoint.
     */
    it('creates session successfully', async () => {
      const sessionId = await createSession('test_user', 'test_session_001');

      // Assert session ID is returned correctly
      expect(sessionId).toBe('test_session_001');
      expect(typeof sessionId).toBe('string');
    });

    /**
     * Test 10: Handles session creation failure
     *
     * Verifies that createSession() correctly handles server errors
     * during session creation and throws an appropriate error.
     */
    it('handles session creation failure', async () => {
      // Override session handler to return 500 error
      server.use(
        http.post(SESSION_URL, () => {
          return HttpResponse.json(
            { message: 'Session creation failed' },
            { status: 500 }
          );
        })
      );

      // Assert that createSession throws an error on failure
      await expect(createSession('test_user', 'test_session_002')).rejects.toThrow(
        'Session creation failed with status 500'
      );
    });
  });

  // ==========================================================================
  // Mutation Testing: buildPrompt() mutant killers
  // ==========================================================================

  describe('buildPrompt() mutant killers', () => {
    /**
     * Tests buildPrompt() indirectly through generatePlan() by capturing
     * the payload sent to /run_sse. Since buildPrompt() is a private function,
     * we verify its output through the new_message text in the request body.
     */

    it('[StringLiteral L77] buildPrompt returns correct format for location only', async () => {
      let capturedText = '';
      const locationOnlyInput: GeneratePlanInput = { location: '94105', kidsAges: [] };

      server.use(
        http.post(RUN_SSE_URL, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          capturedText = ((body.new_message as Record<string, unknown>)?.parts as Array<{ text: string }>)?.[0]?.text || '';
          return new HttpResponse(formatAsSSE([{
            id: 'evt-1', timestamp: new Date().toISOString(), author: 'model',
            content: { role: 'model', parts: [{ text: 'Test plan' }] }
          }]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      await generatePlan(locationOnlyInput);
      expect(capturedText).toBe('Plan a weekend trip for zip code 94105.');
    });

    it('[ConditionalExpression L80] buildPrompt includes kids ages when provided', async () => {
      let capturedText = '';

      server.use(
        http.post(RUN_SSE_URL, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          capturedText = ((body.new_message as Record<string, unknown>)?.parts as Array<{ text: string }>)?.[0]?.text || '';
          return new HttpResponse(formatAsSSE([{
            id: 'evt-1', timestamp: new Date().toISOString(), author: 'model',
            content: { role: 'model', parts: [{ text: 'Test plan' }] }
          }]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      await generatePlan(validInput);
      expect(capturedText).toBe('Plan a weekend trip for zip code 94105. We have kids ages 5, 8.');
    });

    it('[ConditionalExpression L80] buildPrompt with empty kidsAges array omits ages text', async () => {
      let capturedText = '';
      const emptyAgesInput: GeneratePlanInput = { location: '94105', kidsAges: [] };

      server.use(
        http.post(RUN_SSE_URL, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          capturedText = ((body.new_message as Record<string, unknown>)?.parts as Array<{ text: string }>)?.[0]?.text || '';
          return new HttpResponse(formatAsSSE([{
            id: 'evt-1', timestamp: new Date().toISOString(), author: 'model',
            content: { role: 'model', parts: [{ text: 'Test plan' }] }
          }]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      await generatePlan(emptyAgesInput);
      // Catches length > 0 mutated to length >= 0 or length > -1
      expect(capturedText).not.toContain('kids ages');
      expect(capturedText).toBe('Plan a weekend trip for zip code 94105.');
    });

    it('[StringLiteral L81] buildPrompt with single age formats correctly', async () => {
      let capturedText = '';
      const singleAgeInput: GeneratePlanInput = { location: '94105', kidsAges: [5] };

      server.use(
        http.post(RUN_SSE_URL, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          capturedText = ((body.new_message as Record<string, unknown>)?.parts as Array<{ text: string }>)?.[0]?.text || '';
          return new HttpResponse(formatAsSSE([{
            id: 'evt-1', timestamp: new Date().toISOString(), author: 'model',
            content: { role: 'model', parts: [{ text: 'Test plan' }] }
          }]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      await generatePlan(singleAgeInput);
      // Catches the .join(', ') separator string mutant
      expect(capturedText).toBe('Plan a weekend trip for zip code 94105. We have kids ages 5.');
    });
  });

  // ==========================================================================
  // Mutation Testing: parseSSEResponse() mutant killers
  // ==========================================================================

  describe('parseSSEResponse() mutant killers', () => {
    /**
     * Tests parseSSEResponse() indirectly through generatePlan() by providing
     * various SSE-formatted responses from the /run_sse endpoint.
     */

    it('[ConditionalExpression L100] parseSSEResponse parses standard data lines', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          const sseText = 'data: {"id":"1","author":"model","content":{"role":"model","parts":[{"text":"Test plan data"}]}}\n\n';
          return new HttpResponse(sseText, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(true);
      expect(result.planText).toContain('Test plan data');
    });

    it('[StringLiteral L100] parseSSEResponse skips non-data lines', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // Include non-data lines (event:, id:, comment) mixed with a single data line
          const sseText = 'event: message\nid: 1\ndata: {"id":"1","author":"model","content":{"role":"model","parts":[{"text":"Parsed correctly"}]}}\n\n: comment line\n';
          return new HttpResponse(sseText, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(true);
      // Only the "data:" prefixed line should be parsed
      expect(result.planText).toBe('Parsed correctly');
    });

    it('[ConditionalExpression L102] parseSSEResponse handles empty data JSON gracefully', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // Data line with only whitespace after prefix — jsonStr.trim() is empty
          const sseText = 'data: \n\n';
          return new HttpResponse(sseText, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      const result = await generatePlan(validInput);
      // Empty data lines should be skipped -> no events parsed -> error path
      expect(result.success).toBe(false);
    });

    it('[ConditionalExpression L106] parseSSEResponse skips invalid JSON data lines', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // First data line has invalid JSON, second has valid JSON
          const sseText = 'data: not valid json\n\ndata: {"id":"1","author":"model","content":{"role":"model","parts":[{"text":"Valid event"}]}}\n\n';
          return new HttpResponse(sseText, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      const result = await generatePlan(validInput);
      // Invalid JSON line skipped in try/catch, valid line parsed
      expect(result.success).toBe(true);
      expect(result.planText).toContain('Valid event');
    });

    it('[ConditionalExpression L96] parseSSEResponse with empty text returns error', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // Completely empty SSE response — no data lines at all
          return new HttpResponse('', {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
          });
        })
      );

      const result = await generatePlan(validInput);
      // No events parsed -> data.length === 0 -> error path
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ==========================================================================
  // Mutation Testing: extractPlanText() mutant killers
  // ==========================================================================

  describe('extractPlanText() mutant killers', () => {
    /**
     * Tests extractPlanText() indirectly through generatePlan() by providing
     * SSE responses with various author combinations to exercise priority logic.
     */

    it('[EqualityOperator L135] extractPlanText prioritizes SummarizerAgent events', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return new HttpResponse(formatAsSSE([
            { id: 'evt-1', timestamp: new Date().toISOString(), author: 'model',
              content: { role: 'model', parts: [{ text: 'Model text' }] } },
            { id: 'evt-2', timestamp: new Date().toISOString(), author: 'SummarizerAgent',
              content: { role: 'model', parts: [{ text: 'Summary text' }] } }
          ]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(true);
      // SummarizerAgent events take priority over plain model events
      expect(result.planText).toBe('Summary text');
    });

    it('[StringLiteral L135] extractPlanText matches author.includes Summarizer', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return new HttpResponse(formatAsSSE([
            { id: 'evt-1', timestamp: new Date().toISOString(), author: 'model',
              content: { role: 'model', parts: [{ text: 'Model text' }] } },
            { id: 'evt-2', timestamp: new Date().toISOString(), author: 'SummarizerAgent_v2',
              content: { role: 'model', parts: [{ text: 'Summarizer v2 text' }] } }
          ]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(true);
      // author.includes('Summarizer') matches SummarizerAgent_v2
      expect(result.planText).toBe('Summarizer v2 text');
    });

    it('[ConditionalExpression L162] extractPlanText falls back to last model event', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // Only model events, no SummarizerAgent — should take the LAST model event
          return new HttpResponse(formatAsSSE([
            { id: 'evt-1', timestamp: new Date().toISOString(), author: 'model',
              content: { role: 'model', parts: [{ text: 'First model' }] } },
            { id: 'evt-2', timestamp: new Date().toISOString(), author: 'model',
              content: { role: 'model', parts: [{ text: 'Last model' }] } }
          ]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(true);
      // Falls back to last model event (index modelEvents.length - 1)
      expect(result.planText).toBe('Last model');
    });

    it('[ConditionalExpression L180] extractPlanText falls back to all events', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // Non-model, non-summarizer author — last-resort fallback path
          return new HttpResponse(formatAsSSE([
            { id: 'evt-1', timestamp: new Date().toISOString(), author: 'PreprocessInputAgent',
              content: { role: 'model', parts: [{ text: 'Preprocessed data' }] } }
          ]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(true);
      // Falls back to allTextParts from any events with content
      expect(result.planText).toContain('Preprocessed data');
    });

    it('[ConditionalExpression L126] extractPlanText with no content parts returns undefined planText', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // Event with author but no content property — all filters skip it
          return new HttpResponse(formatAsSSE([
            { id: 'evt-1', timestamp: new Date().toISOString(), author: 'model' }
          ]), { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
        })
      );

      const result = await generatePlan(validInput);
      // Event parsed, but extractPlanText returns undefined (no text parts)
      expect(result.success).toBe(true);
      expect(result.planText).toBeUndefined();
    });
  });

  // ==========================================================================
  // Mutation Testing: getErrorMessage() mutant killers
  // ==========================================================================

  describe('getErrorMessage() mutant killers', () => {
    /**
     * Tests getErrorMessage() indirectly through generatePlan() by triggering
     * various HTTP error responses from the /run_sse endpoint.
     */

    it('[ConditionalExpression L364] getErrorMessage status 400 with detail body', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json(
            { detail: 'Missing location' },
            { status: 400 }
          );
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // parsed.detail branch — catches ConditionalExpression on detail || message || error
      expect(result.error!.message).toBe('Invalid request: Missing location');
      expect(result.error!.statusCode).toBe(400);
    });

    it('[ConditionalExpression L368] getErrorMessage status 400 with message body', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json(
            { message: 'Bad input' },
            { status: 400 }
          );
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // parsed.message branch
      expect(result.error!.message).toBe('Invalid request: Bad input');
    });

    it('[ConditionalExpression L368] getErrorMessage status 400 with error body', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json(
            { error: 'Invalid params' },
            { status: 400 }
          );
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // parsed.error branch
      expect(result.error!.message).toBe('Invalid request: Invalid params');
    });

    it('[StringLiteral L374] getErrorMessage status 400 with unparseable body', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return new HttpResponse('Bad stuff', { status: 400 });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // JSON.parse fails -> fallback to raw body in template
      expect(result.error!.message).toContain('Invalid request');
      expect(result.error!.message).toContain('Bad stuff');
    });

    it('[EqualityOperator L364] getErrorMessage status 404 maps to client error', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json(
            { detail: 'Not found' },
            { status: 404 }
          );
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // 404 is >= 400 && < 500 — client error branch
      expect(result.error!.message).toContain('Invalid request');
      expect(result.error!.statusCode).toBe(404);
    });

    it('[ConditionalExpression L377] getErrorMessage status 500 returns server error', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // >= 500 branch — catches StringLiteral mutant on the server error message
      expect(result.error!.message).toBe('Something went wrong on the server. Please try again.');
      expect(result.error!.statusCode).toBe(500);
    });

    it('[EqualityOperator L377] getErrorMessage status 502 returns server error', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json({}, { status: 502 });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // 502 >= 500 — catches >= boundary mutant
      expect(result.error!.message).toBe('Something went wrong on the server. Please try again.');
    });

    it('[EqualityOperator L377] getErrorMessage status 503 returns server error', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.json({}, { status: 503 });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Something went wrong on the server. Please try again.');
    });

    it('[ConditionalExpression L381] getErrorMessage non-4xx-5xx status returns generic message', async () => {
      server.use(
        http.post(RUN_SSE_URL, () => {
          // Status 300 is !ok but not 4xx or 5xx — hits the default return
          return new HttpResponse('', { status: 300 });
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // Default branch: 'Request failed with status 300'
      expect(result.error!.message).toBe('Request failed with status 300');
    });
  });

  // ==========================================================================
  // Mutation Testing: generatePlan() error paths mutant killers
  // ==========================================================================

  describe('generatePlan() error paths mutant killers', () => {
    /**
     * Tests error handling paths in generatePlan() catch blocks and
     * session creation failure handling.
     */

    it('[ConditionalExpression L225] session creation failure returns error with status code', async () => {
      // Override session handler to return 500 — the run_sse handler is irrelevant
      server.use(
        http.post(SESSION_URL, () => {
          return HttpResponse.json(
            { message: 'Session creation failed' },
            { status: 500 }
          );
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      // Catches ConditionalExpression on !createResponse.ok (line 225)
      expect(result.error!.message).toContain('Session creation failed with status 500');
      expect(result.error!.statusCode).toBe(500);
    });

    it('[ConditionalExpression L317] network error returns connection error message', async () => {
      // HttpResponse.error() causes fetch to throw a TypeError with "Failed to fetch"
      server.use(
        http.post(SESSION_URL, () => {
          return HttpResponse.error();
        }),
        http.post(RUN_SSE_URL, () => {
          return HttpResponse.error();
        })
      );

      const result = await generatePlan(validInput);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // The error message from HttpResponse.error() triggers the network/TypeError handler
      expect(result.error!.message).toBeDefined();
    });

    it('[ConditionalExpression L338] TypeError gets connection blocked message', async () => {
      // Mock fetch to throw a TypeError WITHOUT 'fetch' or 'network' in the message
      // so it bypasses line 328 check and hits the TypeError check at line 338
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(
        new TypeError('Connection refused')
      ) as typeof fetch;

      try {
        const result = await generatePlan(validInput);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        // 'Connection refused' does not contain 'fetch' or 'network',
        // so it falls through to the TypeError check at line 338
        expect(result.error!.message).toBe('Connection blocked. See README for proxy setup.');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
