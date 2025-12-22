/**
 * Unit tests for the ADK API client (frontend/src/api/client.ts).
 * 
 * This test file contains 7 comprehensive test cases covering the createSession()
 * and generatePlan() functions. Tests use MSW (Mock Service Worker) for API mocking
 * to run without requiring the actual ADK backend server.
 * 
 * Test Coverage:
 * - generatePlan() success with valid ADK response parsing
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
     */
    it('handles 400 Bad Request with structured error', async () => {
      // Set up handler to return 400 Bad Request with error details
      // The session endpoint is used for both session creation and message sending
      server.use(
        http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', () => {
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
  });

  // ==========================================================================
  // Test Suite: createSession()
  // ==========================================================================

  describe('createSession()', () => {
    /**
     * Test 6: Creates session successfully
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
     * Test 7: Handles session creation failure
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
