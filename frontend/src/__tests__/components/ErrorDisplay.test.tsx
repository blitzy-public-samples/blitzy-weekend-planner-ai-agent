/**
 * Tests for the ErrorDisplay component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, type ErrorDisplayError } from '../../components/ErrorDisplay';

describe('ErrorDisplay', () => {
  // Network error to test user-friendly message mapping
  const networkError: ErrorDisplayError = {
    message: 'Failed to fetch',
    type: 'network'
  };

  // Server error with technical details
  const serverError: ErrorDisplayError = {
    message: 'Internal server error',
    statusCode: 500,
    body: '{"error": "Internal server error"}',
    type: 'server'
  };

  it('displays user-friendly error message', () => {
    render(<ErrorDisplay error={networkError} />);

    // Network errors should display the user-friendly message
    expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
  });

  it('shows expandable "Technical Details" section', () => {
    render(<ErrorDisplay error={serverError} />);

    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    expect(detailsButton).toBeInTheDocument();
    expect(detailsButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders status code in technical details', () => {
    render(<ErrorDisplay error={serverError} />);

    // Expand the details section
    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(detailsButton);

    expect(screen.getByText(/status code:/i)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('shows raw body content when expanded', () => {
    render(<ErrorDisplay error={serverError} />);

    // Expand the details section
    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(detailsButton);

    expect(screen.getByText(/response body:/i)).toBeInTheDocument();
    expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
  });

  it('calls onRetry when Try Again button is clicked', () => {
    const mockOnRetry = vi.fn();
    render(<ErrorDisplay error={serverError} onRetry={mockOnRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  // Additional tests to cover more branches in getUserMessage function

  describe('getUserMessage error type mappings', () => {
    it('displays timeout message for timeout errors', () => {
      const timeoutError: ErrorDisplayError = {
        message: 'Request aborted',
        type: 'timeout'
      };
      render(<ErrorDisplay error={timeoutError} />);
      expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
    });

    it('displays CORS message for cors errors', () => {
      const corsError: ErrorDisplayError = {
        message: 'CORS error',
        type: 'cors'
      };
      render(<ErrorDisplay error={corsError} />);
      expect(screen.getByText(/connection blocked/i)).toBeInTheDocument();
    });

    it('displays parse error message for parse errors', () => {
      const parseError: ErrorDisplayError = {
        message: 'JSON parse error',
        type: 'parse'
      };
      render(<ErrorDisplay error={parseError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });

    it('displays invalid request message for client errors', () => {
      const clientError: ErrorDisplayError = {
        message: 'Bad request data',
        type: 'client'
      };
      render(<ErrorDisplay error={clientError} />);
      expect(screen.getByText(/invalid request: bad request data/i)).toBeInTheDocument();
    });

    it('displays invalid request message for client errors without message', () => {
      const clientError: ErrorDisplayError = {
        message: '',
        type: 'client'
      };
      render(<ErrorDisplay error={clientError} />);
      expect(screen.getByText(/invalid request:.*check your input/i)).toBeInTheDocument();
    });

    it('falls through to status code check for unknown error types', () => {
      const unknownTypeError: ErrorDisplayError = {
        message: 'Some error',
        type: 'unknown_type',
        statusCode: 400
      };
      render(<ErrorDisplay error={unknownTypeError} />);
      expect(screen.getByText(/invalid request/i)).toBeInTheDocument();
    });
  });

  describe('getUserMessage status code mappings', () => {
    it('displays invalid request for 4xx status codes without type', () => {
      const error400: ErrorDisplayError = {
        message: 'Bad request',
        statusCode: 400
      };
      render(<ErrorDisplay error={error400} />);
      expect(screen.getByText(/invalid request: bad request/i)).toBeInTheDocument();
    });

    it('displays server error for 5xx status codes without type', () => {
      const error503: ErrorDisplayError = {
        message: 'Service unavailable',
        statusCode: 503
      };
      render(<ErrorDisplay error={error503} />);
      expect(screen.getByText(/something went wrong on the server/i)).toBeInTheDocument();
    });
  });

  describe('getUserMessage message pattern matching', () => {
    it('detects network error from message pattern - fetch', () => {
      const fetchError: ErrorDisplayError = {
        message: 'Failed to fetch resource'
      };
      render(<ErrorDisplay error={fetchError} />);
      expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
    });

    it('detects network error from message pattern - connection refused', () => {
      const connRefusedError: ErrorDisplayError = {
        message: 'Connection refused by server'
      };
      render(<ErrorDisplay error={connRefusedError} />);
      expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
    });

    it('detects network error from message pattern - econnrefused', () => {
      const econnError: ErrorDisplayError = {
        message: 'ECONNREFUSED'
      };
      render(<ErrorDisplay error={econnError} />);
      expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
    });

    it('detects timeout from message pattern - aborted', () => {
      const abortedError: ErrorDisplayError = {
        message: 'Request was aborted'
      };
      render(<ErrorDisplay error={abortedError} />);
      expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
    });

    it('detects cors from message pattern', () => {
      const corsMessageError: ErrorDisplayError = {
        message: 'CORS policy blocked this request'
      };
      render(<ErrorDisplay error={corsMessageError} />);
      expect(screen.getByText(/connection blocked/i)).toBeInTheDocument();
    });

    it('detects json parse error from message pattern', () => {
      const jsonError: ErrorDisplayError = {
        message: 'Invalid JSON response'
      };
      render(<ErrorDisplay error={jsonError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });

    it('detects unexpected error from message pattern', () => {
      const unexpectedError: ErrorDisplayError = {
        message: 'Unexpected response received'
      };
      render(<ErrorDisplay error={unexpectedError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });

    it('uses original message as fallback when no patterns match', () => {
      const customError: ErrorDisplayError = {
        message: 'Custom error that matches nothing'
      };
      render(<ErrorDisplay error={customError} />);
      expect(screen.getByText(/custom error that matches nothing/i)).toBeInTheDocument();
    });

    it('shows default message when error message is empty', () => {
      const emptyError: ErrorDisplayError = {
        message: ''
      };
      render(<ErrorDisplay error={emptyError} />);
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });
  });

  describe('Technical Details visibility', () => {
    it('hides technical details section when no statusCode or body', () => {
      const simpleError: ErrorDisplayError = {
        message: 'Simple error',
        type: 'network'
      };
      render(<ErrorDisplay error={simpleError} />);
      expect(screen.queryByRole('button', { name: /technical details/i })).not.toBeInTheDocument();
    });

    it('shows technical details section with only statusCode', () => {
      const errorWithStatus: ErrorDisplayError = {
        message: 'Error',
        statusCode: 404
      };
      render(<ErrorDisplay error={errorWithStatus} />);
      expect(screen.getByRole('button', { name: /technical details/i })).toBeInTheDocument();
    });

    it('shows technical details section with only body', () => {
      const errorWithBody: ErrorDisplayError = {
        message: 'Error',
        body: 'Some error details'
      };
      render(<ErrorDisplay error={errorWithBody} />);
      expect(screen.getByRole('button', { name: /technical details/i })).toBeInTheDocument();
    });

    it('collapses technical details on second click', () => {
      render(<ErrorDisplay error={serverError} />);
      
      const detailsButton = screen.getByRole('button', { name: /show technical details/i });
      fireEvent.click(detailsButton);
      
      expect(screen.getByRole('button', { name: /hide technical details/i })).toBeInTheDocument();
      
      fireEvent.click(screen.getByRole('button', { name: /hide technical details/i }));
      expect(screen.getByRole('button', { name: /show technical details/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="alert" on container', () => {
      render(<ErrorDisplay error={networkError} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live="polite" on container', () => {
      render(<ErrorDisplay error={networkError} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-controls linking toggle to details section', () => {
      render(<ErrorDisplay error={serverError} />);
      const detailsButton = screen.getByRole('button', { name: /technical details/i });
      expect(detailsButton).toHaveAttribute('aria-controls', 'error-technical-details');
    });
  });
});
