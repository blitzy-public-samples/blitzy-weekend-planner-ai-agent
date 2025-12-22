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
 * @module __tests__/api/client.test
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { 
  server, 
  create500Handler,
  createMalformedJsonHandler 
} from '../../__mocks__/handlers';
import { createSession, generatePlan } from '../../api/client';
import type { GeneratePlanInput } from '../../types';

// ============================================================================
// Test Data Constants
// ============================================================================

/**
 * Sample GeneratePlanInput with all fields populated.
 * Used for testing the standard success path.
 * 
 * The form now contains only two fields:
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
     */
    it('returns success with valid ADK response', async () => {
      // Default MSW handler returns mock plan response
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
      // The AbortController abort() method throws an error with name 'AbortError'
      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';
      
      // Mock fetch to reject with AbortError, simulating what happens when
      // the AbortController times out and aborts the fetch request
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
     * 
     * The two-step session flow uses the session endpoint for both operations.
     * Session creation (empty body) succeeds, message sending returns 400.
     */
    it('handles 400 Bad Request with structured error', async () => {
      // Set up handler that supports two-step flow:
      // - Session creation (empty body) succeeds
      // - Message sending (with new_message) returns 400
      server.use(
        http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', async ({ request }) => {
          // Parse body to determine request type
          let body: Record<string, unknown> | null = null;
          try {
            const text = await request.text();
            if (text && text.trim()) {
              body = JSON.parse(text);
            }
          } catch {
            body = null;
          }

          const isEmpty = !body || Object.keys(body).length === 0;
          
          if (isEmpty) {
            // Session creation succeeds
            return HttpResponse.json({}, { status: 200 });
          }

          // Message request returns 400 error
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
     */
    it('handles 500 Internal Server Error', async () => {
      // Set up handler to return 500 Internal Server Error
      server.use(create500Handler());

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
     */
    it('handles malformed JSON response', async () => {
      // Set up handler to return invalid JSON content
      server.use(createMalformedJsonHandler());

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
      const requestsReceived: { body: Record<string, unknown> | null }[] = [];
      
      // Mock response for plan generation (similar to handlers.ts mockPlanResponse)
      const mockPlanResponse = [
        {
          id: 'evt-summary-001',
          timestamp: new Date().toISOString(),
          author: 'model',
          content: {
            role: 'model',
            parts: [{ text: '# Weekend Plan\n\nSample plan content for testing.' }]
          }
        }
      ];
      
      server.use(
        http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', 
          async ({ request }) => {
            // Parse body to determine request type
            let body: Record<string, unknown> | null = null;
            try {
              const text = await request.text();
              if (text && text.trim()) {
                body = JSON.parse(text);
              }
            } catch {
              body = null;
            }
            
            const isEmpty = !body || Object.keys(body).length === 0;
            requestsReceived.push({ body: isEmpty ? {} : body });
            
            // Empty body = session creation, return success
            if (isEmpty) {
              return HttpResponse.json({ status: 'created' }, { status: 200 });
            }
            
            // Body with new_message = plan generation, return mock plan
            return HttpResponse.json(mockPlanResponse, { status: 200 });
          }
        )
      );

      await generatePlan(validInput);

      // Should have received exactly 2 requests: session creation + message
      expect(requestsReceived.length).toBe(2);
      
      // First request should have empty body (session creation)
      expect(requestsReceived[0].body).toEqual({});
      
      // Second request should have new_message (plan generation)
      expect(requestsReceived[1].body).toHaveProperty('new_message');
    });

    /**
     * Test 7: Generates unique session ID using crypto.randomUUID()
     * 
     * Verifies that each call to generatePlan() generates a different 
     * UUID-format session ID using crypto.randomUUID().
     */
    it('generates unique session ID using crypto.randomUUID()', async () => {
      const sessionIds: string[] = [];
      
      // Mock response for plan generation
      const mockPlanResponse = [
        {
          id: 'evt-summary-001',
          timestamp: new Date().toISOString(),
          author: 'model',
          content: {
            role: 'model',
            parts: [{ text: '# Weekend Plan\n\nSample plan content.' }]
          }
        }
      ];
      
      server.use(
        http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', 
          async ({ params, request }) => {
            // Capture the session ID from URL params
            sessionIds.push(params.session as string);
            
            // Parse body to determine request type
            let body: Record<string, unknown> | null = null;
            try {
              const text = await request.text();
              if (text && text.trim()) {
                body = JSON.parse(text);
              }
            } catch {
              body = null;
            }
            
            const isEmpty = !body || Object.keys(body).length === 0;
            
            // Return appropriate response based on request type
            if (isEmpty) {
              return HttpResponse.json({ status: 'created' }, { status: 200 });
            }
            
            return HttpResponse.json(mockPlanResponse, { status: 200 });
          }
        )
      );

      // Make two separate calls to generatePlan
      await generatePlan(validInput);
      await generatePlan(validInput);

      // Should have at least 2 unique session IDs (2 calls × 2 requests each = 4 total)
      // Each call should use the same session ID for both requests
      const uniqueIds = [...new Set(sessionIds)];
      expect(uniqueIds.length).toBeGreaterThanOrEqual(2);
      
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
      
      // Mock response for plan generation
      const mockPlanResponse = [
        {
          id: 'evt-summary-001',
          timestamp: new Date().toISOString(),
          author: 'model',
          content: {
            role: 'model',
            parts: [{ text: '# Weekend Plan\n\nSample plan content.' }]
          }
        }
      ];
      
      server.use(
        http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', 
          async ({ request }) => {
            // Parse body to determine request type
            let body: Record<string, unknown> | null = null;
            try {
              const text = await request.text();
              if (text && text.trim()) {
                body = JSON.parse(text);
              }
            } catch {
              body = null;
            }
            
            const isEmpty = !body || Object.keys(body).length === 0;
            
            // Capture the message payload (not the empty session creation request)
            if (!isEmpty && body && body.new_message) {
              capturedPayload = body;
            }
            
            // Return appropriate response based on request type
            if (isEmpty) {
              return HttpResponse.json({ status: 'created' }, { status: 200 });
            }
            
            return HttpResponse.json(mockPlanResponse, { status: 200 });
          }
        )
      );

      await generatePlan(validInput);

      // Verify payload was captured
      expect(capturedPayload).not.toBeNull();
      
      // Verify new_message structure
      expect(capturedPayload).toHaveProperty('new_message');
      
      // Type assertion for TypeScript
      const newMessage = (capturedPayload as { new_message: { role: string; parts: Array<{ text: string }> } }).new_message;
      
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
     */
    it('creates session successfully', async () => {
      // Call createSession with explicit user and session IDs
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
      // Set up handler to return 500 error for session creation
      server.use(
        http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', () => {
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
});
