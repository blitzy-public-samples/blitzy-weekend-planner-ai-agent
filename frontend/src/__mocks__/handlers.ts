/**
 * MSW (Mock Service Worker) request handlers for ADK API endpoints.
 * 
 * This module provides mock handlers for testing the frontend without requiring
 * the actual ADK backend server. It uses MSW 2.x syntax with http.post() and
 * HttpResponse for defining request interceptors.
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
 * Mock ADK response array that simulates the backend's /run endpoint response.
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
      parts: [{ text: '{"zip_code": "94105", "kid_ages": "5,8"}' }]
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

// ============================================================================
// Success Handlers
// ============================================================================

/**
 * Default request handlers for MSW that mock successful API responses.
 * 
 * Includes handlers for:
 * - POST /run - Agent execution endpoint returning mock plan data
 * - POST /apps/:app/users/:user/sessions/:session - Session creation endpoint
 * 
 * Uses wildcard patterns (* /endpoint) to match requests regardless of base URL,
 * supporting both proxied (/api/run) and direct (http://localhost:8000/run) requests.
 */
export const handlers = [
  /**
   * Handler for POST /run - Agent execution endpoint.
   * Returns a mock ADK response array with plan content.
   * Uses explicit URL to match the API client's request to http://localhost:8000/run.
   */
  http.post('http://localhost:8000/run', () => {
    return HttpResponse.json(mockPlanResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }),

  /**
   * Handler for POST /apps/:app/users/:user/sessions/:session - Session creation.
   * Returns an empty object with 200 status indicating successful session creation.
   * Uses explicit URL to match the API client's session creation requests.
   */
  http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', () => {
    return HttpResponse.json({}, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  })
];

// ============================================================================
// Error Handler Factories
// ============================================================================

/**
 * Creates an MSW handler that returns a 400 Bad Request response for the /run endpoint.
 * 
 * Use this handler with server.use() in specific tests to simulate client-side
 * request validation errors from the backend.
 * 
 * @returns MSW http.post handler configured for 400 error response
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
  return http.post('http://localhost:8000/run', () => {
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
 * Creates an MSW handler that returns a 500 Internal Server Error response for the /run endpoint.
 * 
 * Use this handler with server.use() in specific tests to simulate server-side
 * errors from the backend ADK server.
 * 
 * @returns MSW http.post handler configured for 500 error response
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
  return http.post('http://localhost:8000/run', () => {
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
  return http.post('http://localhost:8000/apps/:app/users/:user/sessions/:session', () => {
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
 * Creates an MSW handler that returns a successful response after a specified delay.
 * Use this handler to test loading states by giving enough time for assertions.
 * 
 * @param delayMs - Delay in milliseconds before responding (default: 500ms)
 * @returns MSW http.post handler with delayed response
 * 
 * @example
 * ```typescript
 * server.use(createDelayedHandler(1000)); // 1 second delay
 * ```
 */
export const createDelayedHandler = (delayMs: number = 500) => {
  return http.post('http://localhost:8000/run', async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return HttpResponse.json(mockPlanResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });
};

/**
 * Creates an MSW handler that simulates a timeout by delaying response indefinitely.
 * 
 * Note: In practice, this handler will be aborted by the test's AbortController
 * timeout before completing, allowing timeout handling logic to be tested.
 * 
 * @returns MSW http.post handler that delays response for 60 seconds
 */
export const createTimeoutHandler = () => {
  return http.post('http://localhost:8000/run', async () => {
    // Delay longer than the expected 30-second timeout
    await new Promise((resolve) => setTimeout(resolve, 60000));
    return HttpResponse.json(mockPlanResponse);
  });
};

/**
 * Creates an MSW handler that returns malformed JSON to test parse error handling.
 * 
 * @returns MSW http.post handler that returns invalid JSON content
 */
export const createMalformedJsonHandler = () => {
  return http.post('http://localhost:8000/run', () => {
    return new HttpResponse('not valid json {{{', {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });
};

/**
 * Creates an MSW handler that simulates a network error.
 * 
 * @returns MSW http.post handler that triggers a network error
 */
export const createNetworkErrorHandler = () => {
  return http.post('http://localhost:8000/run', () => {
    return HttpResponse.error();
  });
};

/**
 * Generic error response handler factory.
 * Creates an MSW handler that returns a custom error response for the /run endpoint.
 * 
 * @param status - HTTP status code to return
 * @param body - Response body (will be JSON serialized)
 * @returns MSW http.post handler configured with the specified error response
 * 
 * @example
 * ```typescript
 * server.use(mockErrorResponse(400, { message: 'Invalid input' }));
 * server.use(mockErrorResponse(500, { detail: 'Server error' }));
 * ```
 */
export const mockErrorResponse = (status: number, body: Record<string, unknown>) => {
  return http.post('http://localhost:8000/run', () => {
    return HttpResponse.json(body, {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });
};

/**
 * Pre-configured handler for malformed JSON response testing.
 * Use directly with server.use() instead of calling as a function.
 * 
 * @example
 * ```typescript
 * server.use(mockMalformedJsonHandler);
 * ```
 */
export const mockMalformedJsonHandler = http.post('http://localhost:8000/run', () => {
  return new HttpResponse('not valid json {{{', {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

/**
 * Pre-configured handler for network error testing.
 * Use directly with server.use() instead of calling as a function.
 * 
 * @example
 * ```typescript
 * server.use(mockNetworkErrorHandler);
 * ```
 */
export const mockNetworkErrorHandler = http.post('http://localhost:8000/run', () => {
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
