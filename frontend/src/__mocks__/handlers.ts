/**
 * MSW (Mock Service Worker) request handlers for ADK API endpoints.
 * 
 * This module provides mock handlers for testing the frontend without requiring
 * the actual ADK backend server. It uses MSW 2.x syntax with http.post() and
 * HttpResponse for defining request interceptors.
 * 
 * The API uses a two-step session-based flow:
 * 1. Create session with empty body: POST /apps/WeekendPlanner/users/{userId}/sessions/{sessionId}
 * 2. Send message via POST to /run_sse endpoint with app_name, user_id, session_id, and new_message
 * 
 * @module handlers
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ============================================================================
// Mock Data Structures
// ============================================================================

/**
 * Mock ADK event structure that matches the backend response format.
 * The ADK server returns an array of events, where model responses
 * contain the content property with parts array.
 */
interface MockADKEvent {
  id: string;
  timestamp: string;
  author: string;
  content?: {
    role: string;
    parts: Array<{ text?: string }>;
  };
}

/**
 * Sample weekend plan text returned by the mock API.
 * This content simulates the summarizer_agent's final output from the backend.
 */
const SAMPLE_PLAN_TEXT = `# Weekend Plan for Your Family

## Weather Forecast
Based on the forecast, the weather looks good for outdoor activities this weekend!

## Recommended Activities

### Saturday
- **Morning**: Visit the local farmer's market for fresh produce and family fun
- **Afternoon**: Nature hike at the nearby state park - great for kids of all ages
- **Evening**: Family dinner at a kid-friendly restaurant

### Sunday  
- **Morning**: Brunch at a cozy local cafe
- **Afternoon**: Explore the children's museum with interactive exhibits
- **Evening**: Relaxing movie night at home

## Special Events This Weekend
- Community fair at the town center (Saturday 10am-4pm)
- Outdoor concert in the park (Sunday 3pm)

---
*Disclaimer: These results are based on AI agent research and should be verified for accuracy and availability.*`;

/**
 * Mock ADK response array that simulates the backend's session endpoint response.
 * Contains model events with the plan text. Uses 'model' as author to match
 * the extractPlanText function in the API client which filters for author === 'model'.
 */
const mockPlanResponse: MockADKEvent[] = [
  {
    id: 'evt-preprocess-001',
    timestamp: new Date().toISOString(),
    author: 'model',
    content: {
      role: 'model',
      parts: [{ text: '{"zip_code": "94105", "kid_ages": [5, 8]}' }]
    }
  },
  {
    id: 'evt-weather-002',
    timestamp: new Date().toISOString(),
    author: 'model',
    content: {
      role: 'model',
      parts: [{ text: 'Weather forecast: good conditions for your weekend plan' }]
    }
  },
  {
    id: 'evt-summary-003',
    timestamp: new Date().toISOString(),
    author: 'model',
    content: {
      role: 'model',
      parts: [{ text: SAMPLE_PLAN_TEXT }]
    }
  }
];

/**
 * Converts an array of ADK events to Server-Sent Events (SSE) format.
 * The /run_sse endpoint returns responses in SSE format where each event
 * is prefixed with "data: " followed by a JSON object.
 * 
 * @param events - Array of ADK events to convert
 * @returns SSE-formatted string
 */
function formatAsSSE(events: MockADKEvent[]): string {
  return events.map(event => `data: ${JSON.stringify(event)}`).join('\n\n') + '\n\n';
}

// ============================================================================
// Success Handlers
// ============================================================================

/**
 * Default request handlers for MSW that mock successful API responses.
 * 
 * Includes handlers for the two-step session-based API flow:
 * - POST /apps/WeekendPlanner/users/:userId/sessions/:sessionId - Session creation (empty body)
 * - POST /run_sse - Message sending with app_name, user_id, session_id, and new_message
 * 
 * Uses explicit URL to match the API client's requests to /api.
 */
export const handlers = [
  /**
   * Handler for POST /apps/WeekendPlanner/users/:userId/sessions/:sessionId - Session creation endpoint.
   * Returns success when session is created with empty body.
   */
  http.post('/api/apps/WeekendPlanner/users/:userId/sessions/:sessionId', async ({ request }) => {
    // Try to parse the request body
    let body: Record<string, unknown> | null = null;
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      // Body parsing failed, treat as empty
      body = null;
    }

    // Check if this is a session creation request (empty body)
    const isEmpty = !body || Object.keys(body).length === 0;
    
    if (isEmpty) {
      // Session creation - return success with status: 'created'
      return HttpResponse.json({ status: 'created' }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Non-empty body on session endpoint is an error (should use /run_sse)
    return HttpResponse.json(
      { error: 'Invalid request - use /run_sse for messages' },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }),

  /**
   * Handler for POST /run_sse - Message sending endpoint (ADK streaming endpoint).
   * Returns mock plan response in SSE format when new_message is provided.
   */
  http.post('/api/run_sse', async ({ request }) => {
    // Try to parse the request body
    let body: Record<string, unknown> | null = null;
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      // Body parsing failed
      return HttpResponse.json(
        { error: 'Invalid JSON' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Check if this is a message request (has new_message)
    if (body && 'new_message' in body) {
      // Message sending - return mock plan response in SSE format
      return new HttpResponse(formatAsSSE(mockPlanResponse), {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8'
        }
      });
    }

    // Unknown request format - return error
    return HttpResponse.json(
      { error: 'Invalid request - new_message required' },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  })
];

// ============================================================================
// Error Handler Factories
// ============================================================================

/**
 * Creates an MSW handler that returns a 400 Bad Request response for the /run_sse endpoint.
 * 
 * Use this handler with server.use() in specific tests to simulate client-side
 * request validation errors from the backend.
 * 
 * @returns MSW http.post handler configured for 400 error response on message step
 * 
 * @example
 * ```typescript
 * beforeEach(() => {
 *   server.use(create400Handler());
 * });
 * 
 * it('handles bad request error', async () => {
 *   // Test error handling logic
 * });
 * ```
 */
export const create400Handler = () => {
  return http.post('/api/run_sse', () => {
    // Message request returns 400 error
    return HttpResponse.json(
      { message: 'Invalid request' },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  });
};

/**
 * Creates an MSW handler that returns a 500 Internal Server Error response for the /run_sse endpoint.
 * 
 * Use this handler with server.use() in specific tests to simulate server-side
 * errors from the backend ADK server.
 * 
 * @returns MSW http.post handler configured for 500 error response on message step
 * 
 * @example
 * ```typescript
 * beforeEach(() => {
 *   server.use(create500Handler());
 * });
 * 
 * it('handles server error', async () => {
 *   // Test error handling logic
 * });
 * ```
 */
export const create500Handler = () => {
  return http.post('/api/run_sse', () => {
    // Message request returns 500 error
    return HttpResponse.json(
      { message: 'Server error' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  });
};

/**
 * Creates an MSW handler that returns a failure response for session creation.
 * 
 * Unlike the other error handlers, this one fails immediately on any request
 * (including session creation) to test session creation failure scenarios.
 * 
 * Use this handler with server.use() in specific tests to simulate session
 * creation failures from the backend.
 * 
 * @returns MSW http.post handler configured for session creation failure
 * 
 * @example
 * ```typescript
 * beforeEach(() => {
 *   server.use(createSessionFailureHandler());
 * });
 * 
 * it('handles session creation failure', async () => {
 *   // Test error handling logic
 * });
 * ```
 */
export const createSessionFailureHandler = () => {
  return http.post('/api/apps/WeekendPlanner/users/:userId/sessions/:sessionId', () => {
    return HttpResponse.json(
      { message: 'Session creation failed' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  });
};

// ============================================================================
// Additional Error Handlers for Comprehensive Testing
// ============================================================================

/**
 * Creates MSW handlers that return successful responses after a specified delay.
 * Use this handler to test loading states by giving enough time for assertions.
 * 
 * Returns an array of handlers for both endpoints:
 * - Session creation endpoint with delay
 * - /run_sse endpoint with delay
 * 
 * @param delayMs - Delay in milliseconds before responding (default: 500ms)
 * @returns Array of MSW http.post handlers with delayed responses
 * 
 * @example
 * ```typescript
 * server.use(...createDelayedHandler(1000)); // 1 second delay
 * ```
 */
export const createDelayedHandler = (delayMs: number = 500) => {
  return [
    // Delayed session creation handler
    http.post('/api/apps/WeekendPlanner/users/:userId/sessions/:sessionId', async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return HttpResponse.json({ status: 'created' }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }),
    // Delayed /run_sse handler (returns SSE format)
    http.post('/api/run_sse', async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return new HttpResponse(formatAsSSE(mockPlanResponse), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
      });
    })
  ];
};

/**
 * Creates MSW handlers that simulate a timeout by delaying response indefinitely.
 * 
 * Note: In practice, these handlers will be aborted by the test's AbortController
 * timeout before completing, allowing timeout handling logic to be tested.
 * 
 * @returns Array of MSW http.post handlers that delay response for 60 seconds
 */
export const createTimeoutHandler = () => {
  return [
    http.post('/api/apps/WeekendPlanner/users/:userId/sessions/:sessionId', async () => {
      // Delay longer than the expected 30-second timeout
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return HttpResponse.json({ status: 'created' });
    }),
    http.post('/api/run_sse', async () => {
      // Delay longer than the expected 30-second timeout
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return new HttpResponse(formatAsSSE(mockPlanResponse), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
      });
    })
  ];
};

/**
 * Creates an MSW handler that returns malformed JSON to test parse error handling.
 * 
 * @returns MSW http.post handler for /run_sse that returns invalid JSON content
 */
export const createMalformedJsonHandler = () => {
  return http.post('/api/run_sse', () => {
    // Message request returns SSE format with malformed JSON data
    return new HttpResponse('data: not valid json {{{', {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8'
      }
    });
  });
};

/**
 * Creates MSW handlers that simulate a network error on the API endpoints.
 * 
 * Returns handlers for both session and /run_sse endpoints to test
 * network error handling scenarios.
 * 
 * @returns Array of MSW http.post handlers that trigger network errors
 */
export const createNetworkErrorHandler = () => {
  return [
    http.post('/api/apps/WeekendPlanner/users/:userId/sessions/:sessionId', () => {
      return HttpResponse.error();
    }),
    http.post('/api/run_sse', () => {
      return HttpResponse.error();
    })
  ];
};

/**
 * Generic error response handler factory.
 * Creates MSW handlers that return a custom error response for the API endpoints.
 * 
 * This returns handlers for both endpoints (useful for testing
 * various error scenarios).
 * 
 * @param status - HTTP status code to return
 * @param body - Response body (will be JSON serialized)
 * @returns Array of MSW http.post handlers configured with the specified error response
 * 
 * @example
 * ```typescript
 * server.use(...mockErrorResponse(400, { message: 'Invalid input' }));
 * server.use(...mockErrorResponse(500, { detail: 'Server error' }));
 * ```
 */
export const mockErrorResponse = (status: number, body: Record<string, unknown>) => {
  return [
    http.post('/api/apps/WeekendPlanner/users/:userId/sessions/:sessionId', () => {
      return HttpResponse.json(body, {
        status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }),
    http.post('/api/run_sse', () => {
      return HttpResponse.json(body, {
        status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    })
  ];
};

/**
 * Pre-configured handler for malformed JSON response testing on /run_sse endpoint.
 * Use directly with server.use() instead of calling as a function.
 * 
 * This handler returns malformed JSON on the /run_sse endpoint
 * (useful for testing JSON parse error handling).
 * 
 * @example
 * ```typescript
 * server.use(mockMalformedJsonHandler);
 * ```
 */
export const mockMalformedJsonHandler = http.post('/api/run_sse', () => {
  return new HttpResponse('not valid json {{{', {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

/**
 * Pre-configured handler for network error testing on /run_sse endpoint.
 * Use directly with server.use() instead of calling as a function.
 * 
 * This handler triggers a network error on the /run_sse endpoint
 * (useful for testing network failure scenarios).
 * 
 * @example
 * ```typescript
 * server.use(mockNetworkErrorHandler);
 * ```
 */
export const mockNetworkErrorHandler = http.post('/api/run_sse', () => {
  return HttpResponse.error();
});

// ============================================================================
// Server Instance
// ============================================================================

/**
 * MSW server instance configured with default success handlers.
 * 
 * Provides methods for test lifecycle management:
 * - listen() - Start intercepting requests
 * - resetHandlers() - Reset to default handlers after each test
 * - close() - Stop intercepting requests
 * 
 * @example
 * ```typescript
 * // In test setup (beforeAll)
 * server.listen();
 * 
 * // After each test (afterEach)
 * server.resetHandlers();
 * 
 * // In test teardown (afterAll)
 * server.close();
 * ```
 */
export const server = setupServer(...handlers);
