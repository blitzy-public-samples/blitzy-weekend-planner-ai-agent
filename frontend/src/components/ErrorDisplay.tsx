/**
 * ErrorDisplay Component
 *
 * React functional component for displaying error states with user-friendly
 * messages and expandable technical details. Supports multiple error types
 * including network failures, timeouts, HTTP errors, and CORS issues.
 *
 * @fileoverview Provides accessible error display with:
 * - User-friendly error messages based on error type
 * - Expandable "Technical Details" section showing status code and raw body
 * - Optional retry callback functionality
 * - WCAG AA compliant ARIA attributes
 */

import { useState } from 'react';

/**
 * Error object structure for the ErrorDisplay component.
 * Contains both user-facing and technical error information.
 */
export interface ErrorDisplayError {
  /** User-friendly or technical error message */
  message: string;
  /** HTTP status code if available (e.g., 400, 500) */
  statusCode?: number;
  /** Raw error body from server response for technical debugging */
  body?: string;
  /** Error type classification for determining user message */
  type?: 'network' | 'timeout' | 'cors' | 'client' | 'server' | 'parse' | string;
}

/**
 * Props interface for the ErrorDisplay component
 */
export interface ErrorDisplayProps {
  /** Error details to display */
  error: ErrorDisplayError;
  /** Optional callback function when user clicks "Try Again" button */
  onRetry?: () => void;
}

/**
 * Maps error types and status codes to user-friendly messages.
 * Provides appropriate messaging for different error scenarios.
 *
 * @param error - The error object containing type, status code, and message
 * @returns A user-friendly message string suitable for display
 */
function getUserMessage(error: ErrorDisplayError): string {
  // Check for specific error types first
  if (error.type) {
    switch (error.type) {
      case 'network':
        return "Couldn't reach the backend. Make sure the ADK server is running with `adk web`";
      case 'timeout':
        return 'Request timed out. Please try again.';
      case 'cors':
        return 'Connection blocked. See README for proxy setup.';
      case 'parse':
        return 'Received an unexpected response format';
      case 'client':
        // 4xx client errors - include brief description if available
        return `Invalid request: ${error.message || 'Please check your input and try again.'}`;
      case 'server':
        return 'Something went wrong on the server. Please try again.';
      default:
        // Fall through to status code check
        break;
    }
  }

  // Check status code if type is not specific enough
  if (error.statusCode !== undefined) {
    if (error.statusCode >= 400 && error.statusCode < 500) {
      // 4xx client errors
      return `Invalid request: ${error.message || 'Please check your input and try again.'}`;
    }
    if (error.statusCode >= 500) {
      // 5xx server errors
      return 'Something went wrong on the server. Please try again.';
    }
  }

  // Check for common error message patterns
  const lowerMessage = error.message.toLowerCase();
  if (
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection refused') ||
    lowerMessage.includes('econnrefused')
  ) {
    return "Couldn't reach the backend. Make sure the ADK server is running with `adk web`";
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('aborted')) {
    return 'Request timed out. Please try again.';
  }
  if (lowerMessage.includes('cors')) {
    return 'Connection blocked. See README for proxy setup.';
  }
  if (
    lowerMessage.includes('json') ||
    lowerMessage.includes('parse') ||
    lowerMessage.includes('unexpected')
  ) {
    return 'Received an unexpected response format';
  }

  // Default fallback - use the original message if it exists
  return error.message || 'Received an unexpected response format';
}

/**
 * Error display component with expandable technical details.
 *
 * Renders a styled error container with:
 * - Alert icon and user-friendly message
 * - Optional "Try Again" button when onRetry callback is provided
 * - Collapsible "Technical Details" section showing status code and raw body
 *
 * Implements proper ARIA attributes for accessibility:
 * - role="alert" for screen reader announcement
 * - aria-live="polite" for dynamic content updates
 * - aria-expanded on toggle button for details section
 * - aria-controls linking toggle to details section
 *
 * @param props - Component props containing error details and optional retry callback
 * @returns React element displaying the error with optional technical details
 *
 * @example
 * // Basic error display
 * <ErrorDisplay
 *   error={{ message: "Network error", type: "network" }}
 * />
 *
 * @example
 * // Error with retry and technical details
 * <ErrorDisplay
 *   error={{
 *     message: "Bad request",
 *     statusCode: 400,
 *     body: '{"error": "Invalid input"}',
 *     type: "client"
 *   }}
 *   onRetry={() => handleRetry()}
 * />
 */
export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Determine if there are technical details to show
  const hasDetails = error.statusCode !== undefined || error.body !== undefined;

  // Get the user-friendly message
  const userMessage = getUserMessage(error);

  // Generate unique ID for aria-controls
  const detailsId = 'error-technical-details';

  /**
   * Toggles the visibility of the technical details section
   */
  const handleToggleDetails = (): void => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className="border-2 border-[#E63946] rounded-xl p-6 bg-white"
      role="alert"
      aria-live="polite"
    >
      {/* Error header with icon and message */}
      <div className="flex items-start gap-3">
        {/* Alert icon */}
        <svg
          className="w-6 h-6 text-[#E63946] flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        {/* User-friendly error message */}
        <p className="text-[#E63946] font-semibold flex-1">{userMessage}</p>
      </div>

      {/* Retry button - only shown if onRetry callback is provided */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-[#E07A5F] text-white rounded-lg px-4 py-2 mt-4 hover:bg-[#d06a4f] focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
      )}

      {/* Expandable technical details section */}
      {hasDetails && (
        <div className="mt-4">
          {/* Toggle button for technical details */}
          <button
            type="button"
            onClick={handleToggleDetails}
            className="text-[#3D405B] underline cursor-pointer text-sm hover:text-[#2d2f45] focus:outline-none focus:ring-2 focus:ring-[#3D405B] focus:ring-offset-2 rounded"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
          >
            {isExpanded ? 'Hide Technical Details' : 'Show Technical Details'}
          </button>

          {/* Technical details content - shown when expanded */}
          {isExpanded && (
            <div
              id={detailsId}
              className="bg-gray-100 rounded-lg p-4 mt-4 text-sm font-mono"
            >
              {/* Status code display */}
              {error.statusCode !== undefined && (
                <div className="mb-2">
                  <span className="text-[#3D405B] font-semibold">Status Code: </span>
                  <span className="text-[#E63946]">{error.statusCode}</span>
                </div>
              )}

              {/* Raw body content in preformatted block */}
              {error.body && (
                <div>
                  <span className="text-[#3D405B] font-semibold">Response Body:</span>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-[#3D405B] bg-white p-3 rounded border border-gray-200 overflow-x-auto max-h-64 overflow-y-auto">
                    {error.body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorDisplay;
