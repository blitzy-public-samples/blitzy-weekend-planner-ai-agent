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

    const minimalInput = {
      location: 'San Francisco',
      startDate: '2024-03-15',
      endDate: '2024-03-17'
    };

    const inputWithEmptyOptionals = {
      location: 'San Francisco',
      startDate: '2024-03-15',
      endDate: '2024-03-17',
      kidsAges: '   ',
      preferences: ''
    };

    it('returns success with valid ADK response', async () => {
      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(true);
      expect(result.planText).toBeDefined();
      expect(result.planText).toContain('weekend plan');
      expect(result.rawResponse).toBeDefined();
    });

    it('returns success without optional fields', async () => {
      const result = await generatePlan(minimalInput);
      
      expect(result.success).toBe(true);
      expect(result.planText).toBeDefined();
    });

    it('handles empty optional fields correctly', async () => {
      const result = await generatePlan(inputWithEmptyOptionals);
      
      expect(result.success).toBe(true);
      expect(result.planText).toBeDefined();
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

    it('handles 400 Bad Request with message field', async () => {
      server.use(
        mockErrorResponse(400, { message: 'Missing required field' })
      );

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid request');
      expect(result.error?.statusCode).toBe(400);
    });

    it('handles 400 Bad Request with error field', async () => {
      server.use(
        mockErrorResponse(400, { error: 'Bad input data' })
      );

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid request');
    });

    it('handles 400 Bad Request with plain text body', async () => {
      server.use(
        http.post('http://localhost:8000/run', () => {
          return new HttpResponse('Bad request plain text', { status: 400 });
        })
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

    it('extracts plan text from response with no content', async () => {
      server.use(
        http.post('http://localhost:8000/run', () => {
          return HttpResponse.json([
            {
              id: 'event-1',
              timestamp: new Date().toISOString(),
              author: 'system',
              content: undefined
            }
          ]);
        })
      );

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(true);
      expect(result.planText).toBeUndefined();
    });

    it('handles response with no text parts', async () => {
      server.use(
        http.post('http://localhost:8000/run', () => {
          return HttpResponse.json([
            {
              id: 'event-1',
              timestamp: new Date().toISOString(),
              author: 'model',
              content: {
                role: 'model',
                parts: [{ text: undefined }]
              }
            }
          ]);
        })
      );

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(true);
    });

    it('handles response with empty events array', async () => {
      server.use(
        http.post('http://localhost:8000/run', () => {
          return HttpResponse.json([]);
        })
      );

      const result = await generatePlan(validInput);
      
      expect(result.success).toBe(true);
      expect(result.planText).toBeUndefined();
    });

    it('uses provided sessionId parameter', async () => {
      const result = await generatePlan(validInput, 'custom_user', 'custom_session');
      
      expect(result.success).toBe(true);
    });
  });
});
