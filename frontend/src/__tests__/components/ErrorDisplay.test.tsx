/**
 * ErrorDisplay Component Unit Tests
 *
 * React Testing Library unit test file for the ErrorDisplay component.
 * Contains 4 core test cases validating:
 * 1. User-friendly error message display
 * 2. Expandable Technical Details section
 * 3. Status code rendering in technical details
 * 4. Raw body content display when expanded
 *
 * Additional tests cover error message mappings, accessibility features,
 * and edge cases for comprehensive coverage.
 *
 * @fileoverview Unit tests for ErrorDisplay component using Vitest and
 * React Testing Library. Tests validate error presentation, expandable
 * details functionality, and WCAG AA accessibility compliance.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, type ErrorDisplayError } from '../../components/ErrorDisplay';
import type { PlanError } from '../../types';

/**
 * Test suite for ErrorDisplay component.
 * Validates error display functionality, expandable details,
 * and accessibility features.
 */
describe('ErrorDisplay', () => {
  /**
   * Mock error data for testing different scenarios.
   * Uses ErrorDisplayError which extends PlanError with additional 'type' field.
   */

  // Network error to test user-friendly message mapping
  const networkError: ErrorDisplayError = {
    message: 'Failed to fetch',
    type: 'network',
  };

  // Server error with full technical details (statusCode, body, type)
  const serverError: ErrorDisplayError = {
    message: 'Internal server error',
    statusCode: 500,
    body: '{"error": "Internal server error"}',
    type: 'server',
  };

  // Mock error using PlanError interface (without type field)
  const planErrorMock: PlanError = {
    message: 'Bad request',
    statusCode: 400,
    body: '{"error": "Invalid input parameters"}',
  };

  // ============================================================================
  // CORE REQUIRED TEST CASES (4 tests as per specification)
  // ============================================================================

  /**
   * Test Case 1: Displays user-friendly error message
   *
   * Validates that the component displays appropriate user-friendly messages
   * based on error type, not showing raw technical error details initially.
   * Network errors should show the ADK server running message.
   */
  it('displays user-friendly error message', () => {
    render(<ErrorDisplay error={networkError} />);

    // Network errors should display the user-friendly message
    // Not the raw "Failed to fetch" error
    expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();

    // Verify the raw error message is NOT shown directly
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument();
  });

  /**
   * Test Case 2: Shows expandable 'Technical Details' section
   *
   * Validates that errors with technical details (statusCode or body)
   * display an expandable "Technical Details" button/link.
   * The button should have proper aria-expanded attribute initially false.
   */
  it('shows expandable "Technical Details" section', () => {
    render(<ErrorDisplay error={serverError} />);

    // Find the Technical Details toggle button
    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    expect(detailsButton).toBeInTheDocument();

    // Verify initial collapsed state
    expect(detailsButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(detailsButton);

    // Verify expanded state
    expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * Test Case 3: Renders status code in technical details
   *
   * Validates that the status code is displayed in the technical
   * details section when expanded. The status code should be clearly
   * labeled and visible.
   */
  it('renders status code in technical details', () => {
    render(<ErrorDisplay error={serverError} />);

    // Expand the details section
    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(detailsButton);

    // Verify status code label and value are present
    expect(screen.getByText(/status code:/i)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  /**
   * Test Case 4: Shows raw body content when expanded
   *
   * Validates that the raw error body is displayed in a preformatted
   * section when the technical details are expanded.
   */
  it('shows raw body content when expanded', () => {
    render(<ErrorDisplay error={serverError} />);

    // Expand the details section
    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(detailsButton);

    // Verify response body label and content are present
    expect(screen.getByText(/response body:/i)).toBeInTheDocument();
    // The body content should be visible in the pre element
    expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
  });

  // ============================================================================
  // ADDITIONAL TESTS FOR COMPREHENSIVE COVERAGE
  // ============================================================================

  /**
   * Tests retry callback functionality when onRetry prop is provided.
   */
  it('calls onRetry when Try Again button is clicked', () => {
    const mockOnRetry = vi.fn();
    render(<ErrorDisplay error={serverError} onRetry={mockOnRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  /**
   * Tests that Try Again button is not rendered when onRetry is not provided.
   */
  it('does not show Try Again button when onRetry is not provided', () => {
    render(<ErrorDisplay error={serverError} />);

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  // ============================================================================
  // ERROR TYPE MAPPINGS
  // ============================================================================

  describe('getUserMessage error type mappings', () => {
    it('displays timeout message for timeout errors', () => {
      const timeoutError: ErrorDisplayError = {
        message: 'Request aborted',
        type: 'timeout',
      };
      render(<ErrorDisplay error={timeoutError} />);
      expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
    });

    it('displays CORS message for cors errors', () => {
      const corsError: ErrorDisplayError = {
        message: 'CORS error',
        type: 'cors',
      };
      render(<ErrorDisplay error={corsError} />);
      expect(screen.getByText(/connection blocked/i)).toBeInTheDocument();
    });

    it('displays parse error message for parse errors', () => {
      const parseError: ErrorDisplayError = {
        message: 'JSON parse error',
        type: 'parse',
      };
      render(<ErrorDisplay error={parseError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });

    it('displays invalid request message for client errors', () => {
      const clientError: ErrorDisplayError = {
        message: 'Bad request data',
        type: 'client',
      };
      render(<ErrorDisplay error={clientError} />);
      expect(screen.getByText(/invalid request: bad request data/i)).toBeInTheDocument();
    });

    it('displays invalid request message for client errors without message', () => {
      const clientError: ErrorDisplayError = {
        message: '',
        type: 'client',
      };
      render(<ErrorDisplay error={clientError} />);
      expect(screen.getByText(/invalid request:.*check your input/i)).toBeInTheDocument();
    });

    it('falls through to status code check for unknown error types', () => {
      const unknownTypeError: ErrorDisplayError = {
        message: 'Some error',
        type: 'unknown_type',
        statusCode: 400,
      };
      render(<ErrorDisplay error={unknownTypeError} />);
      expect(screen.getByText(/invalid request/i)).toBeInTheDocument();
    });

    it('displays server error message for 500 type errors', () => {
      render(<ErrorDisplay error={serverError} />);
      expect(screen.getByText(/something went wrong on the server/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // STATUS CODE MAPPINGS
  // ============================================================================

  describe('getUserMessage status code mappings', () => {
    it('displays invalid request for 4xx status codes without type', () => {
      render(<ErrorDisplay error={planErrorMock} />);
      expect(screen.getByText(/invalid request: bad request/i)).toBeInTheDocument();
    });

    it('displays server error for 5xx status codes without type', () => {
      const error503: ErrorDisplayError = {
        message: 'Service unavailable',
        statusCode: 503,
      };
      render(<ErrorDisplay error={error503} />);
      expect(screen.getByText(/something went wrong on the server/i)).toBeInTheDocument();
    });

    it('handles 404 errors appropriately', () => {
      const error404: ErrorDisplayError = {
        message: 'Not found',
        statusCode: 404,
      };
      render(<ErrorDisplay error={error404} />);
      expect(screen.getByText(/invalid request: not found/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // MESSAGE PATTERN MATCHING
  // ============================================================================

  describe('getUserMessage message pattern matching', () => {
    it('detects network error from message pattern - fetch', () => {
      const fetchError: ErrorDisplayError = {
        message: 'Failed to fetch resource',
      };
      render(<ErrorDisplay error={fetchError} />);
      expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
    });

    it('detects network error from message pattern - connection refused', () => {
      const connRefusedError: ErrorDisplayError = {
        message: 'Connection refused by server',
      };
      render(<ErrorDisplay error={connRefusedError} />);
      expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
    });

    it('detects network error from message pattern - econnrefused', () => {
      const econnError: ErrorDisplayError = {
        message: 'ECONNREFUSED',
      };
      render(<ErrorDisplay error={econnError} />);
      expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
    });

    it('detects timeout from message pattern - aborted', () => {
      const abortedError: ErrorDisplayError = {
        message: 'Request was aborted',
      };
      render(<ErrorDisplay error={abortedError} />);
      expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
    });

    it('detects cors from message pattern', () => {
      const corsMessageError: ErrorDisplayError = {
        message: 'CORS policy blocked this request',
      };
      render(<ErrorDisplay error={corsMessageError} />);
      expect(screen.getByText(/connection blocked/i)).toBeInTheDocument();
    });

    it('detects json parse error from message pattern', () => {
      const jsonError: ErrorDisplayError = {
        message: 'Invalid JSON response',
      };
      render(<ErrorDisplay error={jsonError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });

    it('detects unexpected error from message pattern', () => {
      const unexpectedError: ErrorDisplayError = {
        message: 'Unexpected response received',
      };
      render(<ErrorDisplay error={unexpectedError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });

    it('uses original message as fallback when no patterns match', () => {
      const customError: ErrorDisplayError = {
        message: 'Custom error that matches nothing',
      };
      render(<ErrorDisplay error={customError} />);
      expect(screen.getByText(/custom error that matches nothing/i)).toBeInTheDocument();
    });

    it('shows default message when error message is empty', () => {
      const emptyError: ErrorDisplayError = {
        message: '',
      };
      render(<ErrorDisplay error={emptyError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TECHNICAL DETAILS VISIBILITY
  // ============================================================================

  describe('Technical Details visibility', () => {
    it('hides technical details section when no statusCode or body', () => {
      const simpleError: ErrorDisplayError = {
        message: 'Simple error',
        type: 'network',
      };
      render(<ErrorDisplay error={simpleError} />);
      expect(
        screen.queryByRole('button', { name: /technical details/i })
      ).not.toBeInTheDocument();
    });

    it('shows technical details section with only statusCode', () => {
      const errorWithStatus: ErrorDisplayError = {
        message: 'Error',
        statusCode: 404,
      };
      render(<ErrorDisplay error={errorWithStatus} />);
      expect(screen.getByRole('button', { name: /technical details/i })).toBeInTheDocument();
    });

    it('shows technical details section with only body', () => {
      const errorWithBody: ErrorDisplayError = {
        message: 'Error',
        body: 'Some error details',
      };
      render(<ErrorDisplay error={errorWithBody} />);
      expect(screen.getByRole('button', { name: /technical details/i })).toBeInTheDocument();
    });

    it('collapses technical details on second click', () => {
      render(<ErrorDisplay error={serverError} />);

      const detailsButton = screen.getByRole('button', { name: /show technical details/i });
      fireEvent.click(detailsButton);

      // Should now show "Hide Technical Details"
      expect(
        screen.getByRole('button', { name: /hide technical details/i })
      ).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(screen.getByRole('button', { name: /hide technical details/i }));

      // Should be back to "Show Technical Details"
      expect(
        screen.getByRole('button', { name: /show technical details/i })
      ).toBeInTheDocument();
    });

    it('shows only status code when body is not provided', () => {
      const errorStatusOnly: ErrorDisplayError = {
        message: 'Error',
        statusCode: 500,
      };
      render(<ErrorDisplay error={errorStatusOnly} />);

      const detailsButton = screen.getByRole('button', { name: /technical details/i });
      fireEvent.click(detailsButton);

      expect(screen.getByText(/status code:/i)).toBeInTheDocument();
      expect(screen.queryByText(/response body:/i)).not.toBeInTheDocument();
    });

    it('shows only body when statusCode is not provided', () => {
      const errorBodyOnly: ErrorDisplayError = {
        message: 'Error',
        body: '{"detail": "something went wrong"}',
      };
      render(<ErrorDisplay error={errorBodyOnly} />);

      const detailsButton = screen.getByRole('button', { name: /technical details/i });
      fireEvent.click(detailsButton);

      expect(screen.queryByText(/status code:/i)).not.toBeInTheDocument();
      expect(screen.getByText(/response body:/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACCESSIBILITY COMPLIANCE (WCAG AA)
  // ============================================================================

  describe('Accessibility', () => {
    it('has role="alert" on container', () => {
      render(<ErrorDisplay error={networkError} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live="polite" on container for screen reader announcements', () => {
      render(<ErrorDisplay error={networkError} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-controls linking toggle to details section', () => {
      render(<ErrorDisplay error={serverError} />);
      const detailsButton = screen.getByRole('button', { name: /technical details/i });
      expect(detailsButton).toHaveAttribute('aria-controls', 'error-technical-details');
    });

    it('details section has matching id for aria-controls', () => {
      render(<ErrorDisplay error={serverError} />);

      const detailsButton = screen.getByRole('button', { name: /technical details/i });
      fireEvent.click(detailsButton);

      // The details section should have the id that matches aria-controls
      const detailsSection = document.getElementById('error-technical-details');
      expect(detailsSection).toBeInTheDocument();
    });

    it('toggle button updates aria-expanded correctly', () => {
      render(<ErrorDisplay error={serverError} />);

      const detailsButton = screen.getByRole('button', { name: /technical details/i });

      // Initially collapsed
      expect(detailsButton).toHaveAttribute('aria-expanded', 'false');

      // After first click - expanded
      fireEvent.click(detailsButton);
      expect(detailsButton).toHaveAttribute('aria-expanded', 'true');

      // After second click - collapsed again
      fireEvent.click(detailsButton);
      expect(detailsButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // ============================================================================
  // PLAN ERROR TYPE COMPATIBILITY
  // ============================================================================

  describe('PlanError type compatibility', () => {
    /**
     * Verifies that errors conforming to PlanError interface work correctly.
     * PlanError is the base interface from types.ts without the 'type' field.
     */
    it('handles PlanError interface correctly', () => {
      render(<ErrorDisplay error={planErrorMock} />);

      // Should display user-friendly message based on status code
      expect(screen.getByText(/invalid request: bad request/i)).toBeInTheDocument();

      // Technical details should be available
      const detailsButton = screen.getByRole('button', { name: /technical details/i });
      fireEvent.click(detailsButton);

      expect(screen.getByText('400')).toBeInTheDocument();
      expect(screen.getByText(/invalid input parameters/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // MUTATION TESTING — TARGETED MUTANT KILLERS
  // Appended tests use EXACT string matching (not regex) to catch StringLiteral,
  // EqualityOperator, ConditionalExpression, and LogicalOperator mutants that
  // the existing regex-based assertions would not detect.
  // ============================================================================

  describe('Mutation testing - targeted mutant killers', () => {
    // ------------------------------------------------------------------
    // Phase 1: Exact Text Verification (StringLiteral mutant killers)
    // These use `(content) => content === '...'` matchers to catch mutants
    // that alter the exact string returned by getUserMessage().
    // ------------------------------------------------------------------

    it('[StringLiteral L54] network error type returns exact message', () => {
      render(<ErrorDisplay error={{ message: 'x', type: 'network' }} />);
      expect(
        screen.getByText(
          (content) =>
            content ===
            "Couldn't reach the backend. Make sure the ADK server is running with `adk web`"
        )
      ).toBeInTheDocument();
    });

    it('[StringLiteral L56] timeout error type returns exact message', () => {
      render(<ErrorDisplay error={{ message: 'x', type: 'timeout' }} />);
      expect(
        screen.getByText(
          (content) => content === 'Request timed out. Please try again.'
        )
      ).toBeInTheDocument();
    });

    it('[StringLiteral L58] cors error type returns exact message', () => {
      render(<ErrorDisplay error={{ message: 'x', type: 'cors' }} />);
      expect(
        screen.getByText(
          (content) => content === 'Connection blocked. See README for proxy setup.'
        )
      ).toBeInTheDocument();
    });

    it('[StringLiteral L60] parse error type returns exact message', () => {
      render(<ErrorDisplay error={{ message: 'x', type: 'parse' }} />);
      expect(
        screen.getByText(
          (content) => content === 'Received an unexpected response format'
        )
      ).toBeInTheDocument();
    });

    it('[StringLiteral L66] server error type returns exact message', () => {
      render(<ErrorDisplay error={{ message: 'x', type: 'server' }} />);
      expect(
        screen.getByText(
          (content) =>
            content === 'Something went wrong on the server. Please try again.'
        )
      ).toBeInTheDocument();
    });

    // ------------------------------------------------------------------
    // Phase 2: Status-Code Boundary Mutant Killers
    // Catches EqualityOperator / ComparisonOperator mutants on the
    // `>= 400`, `< 500`, and `>= 500` comparisons in getUserMessage().
    // ------------------------------------------------------------------

    it('[EqualityOperator L74] statusCode 400 maps to client error', () => {
      render(<ErrorDisplay error={{ message: 'test', statusCode: 400 }} />);
      // 400 >= 400 && 400 < 500 → client branch
      expect(
        screen.getByText(
          (content) => content === 'Invalid request: test'
        )
      ).toBeInTheDocument();
    });

    it('[EqualityOperator L74] statusCode 399 does NOT map to client error', () => {
      render(
        <ErrorDisplay error={{ message: 'Some 399 error', statusCode: 399 }} />
      );
      // 399 >= 400 is FALSE → skips client & server branches → falls to message
      // pattern matching → 'some 399 error' matches no pattern → fallback to
      // original message. Catches >= 400 mutated to > 400 or >= 399.
      expect(
        screen.getByText(
          (content) => content === 'Some 399 error'
        )
      ).toBeInTheDocument();
    });

    it('[EqualityOperator L74] statusCode 499 maps to client error', () => {
      render(<ErrorDisplay error={{ message: 'test', statusCode: 499 }} />);
      // 499 >= 400 && 499 < 500 → client branch
      // Catches < 500 mutated to < 499 or <= 499
      expect(
        screen.getByText(
          (content) => content === 'Invalid request: test'
        )
      ).toBeInTheDocument();
    });

    it('[EqualityOperator L78] statusCode 500 maps to server error', () => {
      render(<ErrorDisplay error={{ message: 'test', statusCode: 500 }} />);
      // 500 >= 400 && 500 < 500 → FALSE (500 < 500 is false)
      // 500 >= 500 → server branch
      // Catches >= 500 mutated to > 500
      expect(
        screen.getByText(
          (content) =>
            content === 'Something went wrong on the server. Please try again.'
        )
      ).toBeInTheDocument();
    });

    it('[EqualityOperator L78] statusCode 502 maps to server error', () => {
      render(<ErrorDisplay error={{ message: 'test', statusCode: 502 }} />);
      expect(
        screen.getByText(
          (content) =>
            content === 'Something went wrong on the server. Please try again.'
        )
      ).toBeInTheDocument();
    });

    it('[EqualityOperator L78] statusCode 503 maps to server error', () => {
      render(<ErrorDisplay error={{ message: 'test', statusCode: 503 }} />);
      expect(
        screen.getByText(
          (content) =>
            content === 'Something went wrong on the server. Please try again.'
        )
      ).toBeInTheDocument();
    });

    it('[EqualityOperator L74] statusCode 403 maps to client error', () => {
      render(
        <ErrorDisplay error={{ message: 'Forbidden', statusCode: 403 }} />
      );
      expect(
        screen.getByText(
          (content) => content === 'Invalid request: Forbidden'
        )
      ).toBeInTheDocument();
    });

    // ------------------------------------------------------------------
    // Phase 3: Conditional Retry Button (ConditionalExpression killers)
    // ------------------------------------------------------------------

    it('[ConditionalExpression L195] retry button appears when onRetry is provided', () => {
      render(
        <ErrorDisplay
          error={{ message: 'Error', type: 'server' }}
          onRetry={vi.fn()}
        />
      );
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });

    it('[ConditionalExpression L195] retry button absent when onRetry is undefined', () => {
      render(<ErrorDisplay error={{ message: 'Error', type: 'server' }} />);
      expect(
        screen.queryByRole('button', { name: /try again/i })
      ).not.toBeInTheDocument();
    });

    // ------------------------------------------------------------------
    // Phase 4: Error-Type String-Match Mutants
    // ------------------------------------------------------------------

    it('[StringLiteral L53] network type string is exact match', () => {
      // Lowercase 'network' hits the correct switch case
      const { unmount } = render(
        <ErrorDisplay error={{ message: 'x', type: 'network' }} />
      );
      expect(
        screen.getByText(
          (content) =>
            content ===
            "Couldn't reach the backend. Make sure the ADK server is running with `adk web`"
        )
      ).toBeInTheDocument();
      unmount();

      // Uppercase 'Network' does NOT match the case-sensitive switch, so the
      // code falls through to message-pattern matching; 'x' matches nothing →
      // default fallback returns 'x'. Catches mutants that alter the type literal.
      render(<ErrorDisplay error={{ message: 'x', type: 'Network' }} />);
      expect(
        screen.getByText((content) => content === 'x')
      ).toBeInTheDocument();
    });

    it('[ConditionalExpression L51] error with undefined type falls through to status code check', () => {
      // No `type` field → switch is skipped → statusCode 500 >= 500 → server msg
      // Catches mutant that removes the `if (error.type)` guard
      render(<ErrorDisplay error={{ message: 'test', statusCode: 500 }} />);
      expect(
        screen.getByText(
          (content) =>
            content === 'Something went wrong on the server. Please try again.'
        )
      ).toBeInTheDocument();
    });

    // ------------------------------------------------------------------
    // Phase 5: Default Fallback Mutant Killers
    // ------------------------------------------------------------------

    it('[StringLiteral L109] default fallback returns original message when no patterns match', () => {
      render(<ErrorDisplay error={{ message: 'Unique custom message XYZ' }} />);
      expect(
        screen.getByText(
          (content) => content === 'Unique custom message XYZ'
        )
      ).toBeInTheDocument();
    });

    it('[StringLiteral L109] default fallback returns format message when message is empty', () => {
      // Empty string is falsy → OR fallback triggers
      // Catches LogicalOperator (||) mutant and StringLiteral mutant
      render(<ErrorDisplay error={{ message: '' }} />);
      expect(
        screen.getByText(
          (content) => content === 'Received an unexpected response format'
        )
      ).toBeInTheDocument();
    });
  });
});
