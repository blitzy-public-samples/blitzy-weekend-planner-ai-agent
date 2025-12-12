/**
 * ErrorDisplay component shows user-friendly error messages
 * with an expandable technical details section.
 */

import { useState } from 'react';
import type { ApiError } from '../types';

/**
 * Props for the ErrorDisplay component
 */
export interface ErrorDisplayProps {
  /** Error details to display */
  error: ApiError;
  /** Callback function when user clicks retry */
  onRetry?: () => void;
}

/**
 * Error display component with expandable technical details.
 * Shows a user-friendly message with optional retry button and
 * collapsible section for status code and raw error body.
 */
export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDetails = error.statusCode !== undefined || error.rawBody;

  return (
    <div 
      className="bg-error/10 border border-error rounded-xl p-6 space-y-4"
      role="alert"
      aria-live="polite"
    >
      {/* User-friendly error message */}
      <div className="flex items-start gap-3">
        <span className="text-error text-xl" aria-hidden="true">⚠</span>
        <div className="flex-1">
          <p className="text-text font-medium">{error.message}</p>
        </div>
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                     transition-colors"
        >
          Try Again
        </button>
      )}

      {/* Expandable technical details */}
      {hasDetails && (
        <div className="border-t border-error/20 pt-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-text/70 hover:text-text flex items-center gap-2
                       focus:outline-none focus:text-text"
            aria-expanded={isExpanded}
          >
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            Technical Details
          </button>

          {isExpanded && (
            <div className="mt-3 p-3 bg-text/5 rounded-lg text-sm font-mono space-y-2">
              {error.statusCode !== undefined && (
                <p>
                  <span className="text-text/60">Status Code:</span>{' '}
                  <span className="text-error">{error.statusCode}</span>
                </p>
              )}
              {error.rawBody && (
                <div>
                  <p className="text-text/60 mb-1">Response Body:</p>
                  <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                    {error.rawBody}
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
