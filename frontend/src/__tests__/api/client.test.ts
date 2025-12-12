/**
 * Tests for the ADK API client
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { createSession, generatePlan } from '../../api/client';
import { server, mockErrorResponse, mockMalformedJsonHandler, mockNetworkErrorHandler } from '../../__mocks__/handlers';
import { http, HttpResponse } from 'msw';

describe('API Client', () => {
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  describe('createSession', () => {
    it('creates session successfully', async () => {
      const sessionId = await createSession('test_user', 'test_session');
      expect(sessionId).toBe('test_session');
    });

    it('handles session creation failure', async () => {
      server.use(
        http.post('http://localhost:8000/apps/:appName/users/:userId/sessions/:sessionId', () => {
          return HttpResponse.json({ error: 'Session creation failed' }, { status: 500 });
        })
      );

      await expect(createSession('test_user', 'test_session')).rejects.toThrow(
        'Session creation failed with status 500'
      );
    });
  });

  describe('generatePlan', () => {
    const validInput = {
      location: 'San Francisco',
      startDate: '2024-03-15',
      endDate: '2024-03-17',
      kidsAges: '5, 8',
      preferences: 'outdoor activities'
    };

    it('returns success with valid ADK response', async () => {
      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(true);
      expect(result.planText).toBeDefined();
      expect(result.planText).toContain('weekend plan');
      expect(result.rawResponse).toBeDefined();
    });

    it('handles 400 Bad Request with structured error', async () => {
      server.use(
        mockErrorResponse(400, { detail: 'Invalid request parameters' })
      );

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid request');
      expect(result.error?.statusCode).toBe(400);
    });

    it('handles 500 Internal Server Error', async () => {
      server.use(mockErrorResponse(500, { error: 'Internal server error' }));

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Something went wrong on the server');
      expect(result.error?.statusCode).toBe(500);
    });

    it('handles malformed JSON response', async () => {
      server.use(mockMalformedJsonHandler);

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('unexpected response format');
    });

    it('handles network errors', async () => {
      server.use(mockNetworkErrorHandler);

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(false);
      // Should provide user-friendly error message
      expect(result.error?.message).toBeDefined();
    });
  });
});
