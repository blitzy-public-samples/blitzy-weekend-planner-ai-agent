/**
 * App Component Integration Tests
 *
 * Comprehensive test suite for the root App.tsx component (262 lines, previously 0% coverage).
 * Tests validate state management (isLoading, error, result, lastInput), callback dispatch
 * (handleSubmit, handleReset, handleRetry), conditional render-priority logic
 * (loading → error → success → idle), and UI structure.
 *
 * Each test description includes [MutatorName L##] prefix for Stryker mutation testing
 * traceability, identifying the specific mutant category and source line targeted.
 *
 * Uses MSW for network-level API mocking with handlers matching the actual
 * API client URLs (http://localhost:8000/...).
 *
 * @fileoverview Root component integration tests for mutation-testing-driven coverage
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__mocks__/handlers';
import App from '../../App';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

/** Base URL matching the API client default when VITE_API_BASE_URL is unset */
const API_BASE = 'http://localhost:8000';

/** Sample plan text used in success SSE responses */
const PLAN_TEXT =
  '# Weekend Plan for Your Family\n\n## Activities\n\n' +
  '- Visit the local park for a morning walk\n' +
  '- Go to the children\'s museum in the afternoon';

/**
 * Builds an SSE-formatted response string from the given plan text.
 * Mirrors the backend SSE format: `data: {JSON}\n\n`
 *
 * @param text - Plan text to embed in the model event
 * @returns SSE-formatted string consumable by parseSSEResponse in client.ts
 */
function createSuccessSSE(text: string = PLAN_TEXT): string {
  const event = {
    id: 'evt-test-001',
    timestamp: new Date().toISOString(),
    author: 'model',
    content: { role: 'model', parts: [{ text }] },
  };
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Registers MSW handlers for the session-creation and run_sse endpoints that
 * return a successful plan generation flow. These match the actual URLs built
 * by the API client (http://localhost:8000/...).
 */
function setupSuccessHandlers(): void {
  server.use(
    http.post(
      `${API_BASE}/apps/WeekendPlanner/users/:userId/sessions/:sessionId`,
      () => HttpResponse.json({ status: 'created' }, { status: 200 }),
    ),
    http.post(`${API_BASE}/run_sse`, () => {
      return new HttpResponse(createSuccessSSE(), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    }),
  );
}

/**
 * Registers MSW handlers that delay both endpoints by the specified duration,
 * then respond with a successful plan generation flow. Useful for asserting
 * loading-state visibility before the response arrives.
 *
 * @param delayMs - Milliseconds to delay each endpoint response
 */
function setupDelayedHandlers(delayMs: number): void {
  server.use(
    http.post(
      `${API_BASE}/apps/WeekendPlanner/users/:userId/sessions/:sessionId`,
      async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        return HttpResponse.json({ status: 'created' }, { status: 200 });
      },
    ),
    http.post(`${API_BASE}/run_sse`, async () => {
      await new Promise((r) => setTimeout(r, delayMs));
      return new HttpResponse(createSuccessSSE(), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    }),
  );
}

/**
 * Registers an MSW handler that returns an HTTP 500 on the /run_sse endpoint.
 * Session creation still succeeds so the error path in App.tsx line 100-107
 * is exercised (not the session-failure path).
 */
function setupRunSse500Handler(): void {
  server.use(
    http.post(
      `${API_BASE}/apps/WeekendPlanner/users/:userId/sessions/:sessionId`,
      () => HttpResponse.json({ status: 'created' }, { status: 200 }),
    ),
    http.post(`${API_BASE}/run_sse`, () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }),
  );
}

/**
 * Registers MSW handlers that return a network-level error on both endpoints.
 * Exercises the catch block in generatePlan (client.ts) and subsequently
 * the error construction in App.tsx lines 100-107.
 */
function setupNetworkErrorHandlers(): void {
  server.use(
    http.post(
      `${API_BASE}/apps/WeekendPlanner/users/:userId/sessions/:sessionId`,
      () => HttpResponse.error(),
    ),
    http.post(`${API_BASE}/run_sse`, () => HttpResponse.error()),
  );
}

/**
 * Registers an MSW handler that returns HTTP 500 on session creation itself,
 * exercising the session-creation failure path in generatePlan (client.ts).
 */
function setupSessionFailureHandler(): void {
  server.use(
    http.post(
      `${API_BASE}/apps/WeekendPlanner/users/:userId/sessions/:sessionId`,
      () =>
        HttpResponse.json(
          { message: 'Session creation failed' },
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        ),
    ),
  );
}

/**
 * Helper: fills the zip-code field and clicks "Generate Plan".
 *
 * @param user - userEvent instance from userEvent.setup()
 * @param zip  - Zip code value to type (default '94105')
 */
async function submitForm(
  user: ReturnType<typeof userEvent.setup>,
  zip = '94105',
): Promise<void> {
  const zipInput = screen.getByLabelText(/zip code/i);
  await user.type(zipInput, zip);
  const submitBtn = screen.getByRole('button', { name: /generate plan/i });
  await user.click(submitBtn);
}

// ===========================================================================
// Test Suite
// ===========================================================================

describe('App', () => {
  // Provide default success handlers so any test that triggers API calls
  // gets a valid response. Individual tests override as needed.
  beforeEach(() => {
    setupSuccessHandlers();
  });

  // -------------------------------------------------------------------------
  // Phase 1 — Initial Render (Idle State)
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L169] renders idle state with guidance text on initial load', () => {
    render(<App />);

    // Main heading
    expect(
      screen.getByRole('heading', { level: 1, name: /weekend planner/i }),
    ).toBeInTheDocument();

    // Idle guidance heading (h2)
    expect(screen.getByText(/plan your perfect weekend/i)).toBeInTheDocument();

    // Idle guidance description
    expect(
      screen.getByText(/enter your details and click generate plan/i),
    ).toBeInTheDocument();

    // InputForm is rendered (zip code field present)
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();

    // LoadingState is NOT shown
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // ErrorDisplay is NOT shown
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('[BooleanLiteral L63] isLoading initializes to false — no loading skeleton shown', () => {
    render(<App />);

    // LoadingState text absent
    expect(
      screen.queryByText(/creating your perfect weekend/i),
    ).not.toBeInTheDocument();

    // Idle "Getting started" region visible
    expect(
      screen.getByRole('region', { name: /getting started/i }),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 2 — State Transition: Idle → Loading → Success
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L154] shows LoadingState during API call', async () => {
    // Delay responses so we can observe the loading state
    setupDelayedHandlers(3000);

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // LoadingState should appear
    const status = await screen.findByRole('status');
    expect(status).toBeInTheDocument();
    expect(
      screen.getByText(/creating your perfect weekend/i),
    ).toBeInTheDocument();

    // Idle guidance should be gone
    expect(
      screen.queryByText(/plan your perfect weekend/i),
    ).not.toBeInTheDocument();
  });

  it('[ConditionalExpression L97] renders PlanView on successful API response', async () => {
    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // PlanView heading appears after successful response
    const heading = await screen.findByRole('heading', {
      name: /your weekend plan/i,
    });
    expect(heading).toBeInTheDocument();

    // Plan text content is visible
    expect(
      screen.getByText(/weekend plan for your family/i),
    ).toBeInTheDocument();

    // LoadingState is gone
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // Idle guidance is gone
    expect(
      screen.queryByText(/plan your perfect weekend/i),
    ).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 3 — State Transition: Idle → Loading → Error
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L159] shows ErrorDisplay on API 500 error', async () => {
    setupRunSse500Handler();

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // ErrorDisplay alert appears
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();

    // User-friendly server error message from ErrorDisplay / client.ts
    expect(
      screen.getByText(/something went wrong on the server/i),
    ).toBeInTheDocument();

    // LoadingState should be gone
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('[ConditionalExpression L100] ErrorDisplay shows for session creation failure', async () => {
    setupSessionFailureHandler();

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // ErrorDisplay alert appears
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();

    // Session failure produces a server-error user message
    expect(
      screen.getByText(/something went wrong on the server/i),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 4 — Reset Flow (Success → Idle)
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L124] handleReset clears state back to idle', async () => {
    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // Wait for success state
    await screen.findByRole('heading', { name: /your weekend plan/i });

    // Click Reset button
    const resetBtn = screen.getByRole('button', { name: /reset/i });
    await user.click(resetBtn);

    // Idle guidance should re-appear
    await waitFor(() => {
      expect(
        screen.getByText(/plan your perfect weekend/i),
      ).toBeInTheDocument();
    });

    // PlanView should be gone
    expect(
      screen.queryByRole('heading', { name: /your weekend plan/i }),
    ).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 5 — Retry Flow (Error → Loading → Success)
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L136] handleRetry reuses lastInput for re-attempt', async () => {
    // First request returns 500
    setupRunSse500Handler();

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // Wait for error
    await screen.findByRole('alert');

    // Now swap to success handlers for retry
    setupSuccessHandlers();

    // Click Try Again
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    // Should eventually show success
    const heading = await screen.findByRole('heading', {
      name: /your weekend plan/i,
    });
    expect(heading).toBeInTheDocument();

    // Error alert should be gone
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 6 — Conditional Render Priority
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L154] loading state takes priority over previous error during retry', async () => {
    // First request returns 500
    setupRunSse500Handler();

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // Wait for error display
    await screen.findByRole('alert');

    // Set up delayed handlers so loading state persists during retry
    setupDelayedHandlers(3000);

    // Click Try Again
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    // Loading takes priority — status element appears, alert disappears
    const status = await screen.findByRole('status');
    expect(status).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('[ConditionalExpression L159] error state takes priority over idle guidance', async () => {
    setupRunSse500Handler();

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // Error alert should be present
    await screen.findByRole('alert');

    // Idle guidance should NOT be visible
    expect(
      screen.queryByText(/plan your perfect weekend/i),
    ).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 7 — Callback Prop Wiring
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L239] InputForm onSubmit triggers plan generation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // API call succeeds → PlanView heading appears, proving onSubmit wiring
    const heading = await screen.findByRole('heading', {
      name: /your weekend plan/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('[ConditionalExpression L241] InputForm isLoading prop disables form during request', async () => {
    setupDelayedHandlers(3000);

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // During loading the button text changes to "Generating..."
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generating/i }),
      ).toBeInTheDocument();
    });

    // The submit button should be aria-disabled during loading
    const genBtn = screen.getByRole('button', { name: /generating/i });
    expect(genBtn).toHaveAttribute('aria-disabled', 'true');
  });

  // -------------------------------------------------------------------------
  // Phase 8 — Error Object Construction
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L112] catch block handles thrown Error objects', async () => {
    // Import the client module so we can spy on generatePlan
    const clientModule = await import('../../api/client');
    // Use a message that does NOT match any ErrorDisplay getUserMessage
    // patterns (fetch, network, timeout, cors, json, parse, unexpected)
    // so it passes through as-is.
    const spy = vi
      .spyOn(clientModule, 'generatePlan')
      .mockRejectedValueOnce(new Error('Simulated crash test 42'));

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // Error display appears with the thrown error's message passed through
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();

    // App.tsx line 112: err instanceof Error → uses err.message
    // ErrorDisplay falls through to the default: renders the original message
    expect(screen.getByText(/simulated crash test 42/i)).toBeInTheDocument();

    spy.mockRestore();
  });

  it('[StringLiteral L112] catch block handles non-Error thrown values', async () => {
    const clientModule = await import('../../api/client');
    const spy = vi
      .spyOn(clientModule, 'generatePlan')
      .mockRejectedValueOnce('plain string error');

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // When the thrown value is not an Error instance, App.tsx line 112
    // sets message to "An unexpected error occurred".
    // ErrorDisplay's getUserMessage then transforms messages containing
    // "unexpected" to "Received an unexpected response format".
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByText(/received an unexpected response format/i),
    ).toBeInTheDocument();

    spy.mockRestore();
  });

  it('[StringLiteral L104] error message propagation from API planError', async () => {
    // Return a 500 with a specific message body so that
    // client.ts getErrorMessage returns a server-error string and
    // App.tsx stores the message in error state.
    setupRunSse500Handler();

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    await screen.findByRole('alert');

    // The server error path in client.ts getErrorMessage for status >= 500
    // returns "Something went wrong on the server. Please try again."
    expect(
      screen.getByText(/something went wrong on the server/i),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 9 — Network Error Handling
  // -------------------------------------------------------------------------

  it('[ConditionalExpression L97] network error displays connectivity message', async () => {
    setupNetworkErrorHandlers();

    const user = userEvent.setup();
    render(<App />);
    await submitForm(user);

    // Network errors produce a "Couldn't reach the backend" message
    // from client.ts catch block, then routed through ErrorDisplay.
    // App.tsx L97: planResult.success is false → enters else branch → sets error state.
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();

    // Verify a network-specific message is shown, not a generic/input error —
    // this catches StringLiteral mutants in the error message pipeline
    expect(alert).toHaveTextContent(
      /couldn.*t reach the backend|connection blocked|failed to fetch/i,
    );
  });

  // -------------------------------------------------------------------------
  // Phase 10 — UI Structure
  // -------------------------------------------------------------------------

  it('[StringLiteral L221] renders header with "Weekend Planner" title', () => {
    render(<App />);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Weekend Planner');

    // Subtitle
    expect(
      screen.getByText(/plan the perfect family weekend with ai/i),
    ).toBeInTheDocument();
  });

  it('[StringLiteral L255] renders footer with attribution text', () => {
    render(<App />);

    expect(
      screen.getByText(/powered by google adk and gemini ai/i),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Phase 11 — NoCoverage Mutant Killers (Stryker D7 verification)
  // -------------------------------------------------------------------------

  it('[StringLiteral L104] error without message triggers fallback text', async () => {
    // Targets L104: planError?.message || 'An unknown error occurred'
    // When generatePlan returns an error without a message (empty string),
    // the || fallback triggers and 'An unknown error occurred' is used.
    // Mock fetch to throw an Error with empty message, which bypasses all
    // named error checks in generatePlan's catch block and returns { message: '' }.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(
      new Error(''),
    ) as typeof fetch;

    try {
      const user = userEvent.setup();
      render(<App />);
      await submitForm(user);

      // Wait for error state to render
      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();

      // The empty error message from generatePlan triggers App.tsx L104 fallback
      // 'An unknown error occurred' is then displayed via ErrorDisplay
      expect(alert).toHaveTextContent(/unknown error occurred/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
