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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { 
  server, 
  create500Handler,
  createMalformedJsonHandler,
  createTimeoutHandler 
} from '../../__mocks__/handlers';
import { createSession, generatePlan } from '../../api/client';
import type { GeneratePlanInput } from '../../types';

// ============================================================================
// Test Data Constants
// ============================================================================

/**
 * Sample GeneratePlanInput with all fields populated.
 * Used for testing the standard success path.
 */
const validInput: GeneratePlanInput = {
  location: 'San Francisco',
  startDate: '2024-01-15',
  endDate: '2024-01-16',
  kidsAges: '5, 8',
  preferences: 'outdoor activities, avoid crowds'
};

/**
 * Minimal GeneratePlanInput with only required fields.
 * Used to test that optional fields are handled correctly.
 */
const minimalInput: GeneratePlanInput = {
  location: 'San Francisco',
  startDate: '2024-01-15',
  endDate: '2024-01-16'
};

/**
 * Mock ADK response structure that matches the backend's /run endpoint response.
 * Contains a model event with plan content for testing response parsing.
 */
const mockADKResponse = [
  {
    id: 'evt_001',
    timestamp: '2024-01-15T10:00:00Z',
    author: 'model',
    content: {
      parts: [{ text: 'Here is your weekend plan for San Francisco...' }],
      role: 'model'
    }
  }
];

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
     * using AbortController. Uses fake timers to control time advancement.
     */
    it('handles 30-second timeout', async () => {
      // Enable fake timers to control time advancement
      vi.useFakeTimers();

      // Set up handler that delays response indefinitely (simulating slow/hung server)
      server.use(createTimeoutHandler());

      // Start the generatePlan call (it will wait for timeout)
      const resultPromise = generatePlan(validInput);

      // Advance timers past the 30-second timeout threshold
      await vi.advanceTimersByTimeAsync(30000);

      // Wait for the promise to resolve with timeout error
      const result = await resultPromise;

      // Assert timeout error handling
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Request timed out. Please try again.');

      // Clean up fake timers
      vi.useRealTimers();
    });

    /**
     * Test 3: Handles 400 Bad Request with structured error
     * 
     * Verifies that generatePlan() correctly handles 400 status responses
     * and extracts error details from the response body.
     */
    it('handles 400 Bad Request with structured error', async () => {
      // Set up handler to return 400 Bad Request with error details
      server.use(
        http.post('http://localhost:8000/run', () => {
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
