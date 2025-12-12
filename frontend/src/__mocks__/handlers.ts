/**
 * MSW (Mock Service Worker) request handlers for testing.
 * Mocks the ADK backend API endpoints.
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ADKResponse } from '../types';

/**
 * Mock ADK response for successful plan generation
 */
const mockSuccessResponse: ADKResponse = [
  {
    id: 'event-1',
    timestamp: new Date().toISOString(),
    author: 'model',
    content: {
      role: 'model',
      parts: [
        {
          text: `Here's your weekend plan!

## Saturday
- Morning: Visit the local farmer's market
- Afternoon: Hike at the nearby state park
- Evening: Dinner at a family-friendly restaurant

## Sunday
- Morning: Brunch at a local cafe
- Afternoon: Visit the children's museum
- Evening: Movie night at home

Have a wonderful weekend!`
        }
      ]
    }
  }
];

/**
 * API base URL for handlers
 */
const API_BASE_URL = 'http://localhost:8000';

/**
 * Request handlers for MSW
 */
export const handlers = [
  // Session creation handler
  http.post(`${API_BASE_URL}/apps/:appName/users/:userId/sessions/:sessionId`, () => {
    return HttpResponse.json({ status: 'created' }, { status: 200 });
  }),

  // Agent run handler
  http.post(`${API_BASE_URL}/run`, async () => {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100));
    return HttpResponse.json(mockSuccessResponse, { status: 200 });
  })
];

/**
 * MSW server instance for use in tests
 */
export const server = setupServer(...handlers);

/**
 * Mock success response for use in tests
 */
export { mockSuccessResponse };

/**
 * Helper to add error handlers for specific test scenarios
 */
export const mockErrorResponse = (status: number, body?: object | string) => {
  return http.post(`${API_BASE_URL}/run`, () => {
    if (typeof body === 'string') {
      return new HttpResponse(body, { status });
    }
    return HttpResponse.json(body || { error: 'Server error' }, { status });
  });
};

/**
 * Handler for timeout simulation
 */
export const mockTimeoutHandler = http.post(`${API_BASE_URL}/run`, async () => {
  // Simulate a very long delay (longer than test timeout)
  await new Promise((resolve) => setTimeout(resolve, 60000));
  return HttpResponse.json(mockSuccessResponse);
});

/**
 * Handler for malformed JSON response
 */
export const mockMalformedJsonHandler = http.post(`${API_BASE_URL}/run`, () => {
  return new HttpResponse('not valid json {{{', {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Handler for network error simulation
 */
export const mockNetworkErrorHandler = http.post(`${API_BASE_URL}/run`, () => {
  return HttpResponse.error();
});
