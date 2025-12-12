/**
 * RawOutput Component
 * 
 * A collapsible JSON viewer component that displays raw ADK API response data.
 * Used by PlanView to allow users to inspect the full ADK response for debugging
 * or transparency purposes.
 * 
 * Features:
 * - Collapsed by default to keep the UI clean
 * - Toggle button to expand/collapse the raw JSON display
 * - JSON data displayed in a preformatted block with monospace font
 * - Smooth transition animations for expand/collapse
 * - Full accessibility support with ARIA attributes
 * 
 * @fileoverview Collapsible raw output viewer component for ADK responses
 */

import { useState } from 'react';
import type { ADKResponse } from '../types';

/**
 * Props interface for the RawOutput component.
 * Defines the required data and optional customization properties.
 */
export interface RawOutputProps {
  /**
   * Raw ADK response data to display as formatted JSON.
   * This is the full array of events from the agent pipeline.
   */
  data: ADKResponse;

  /**
   * Optional title text for the toggle button.
   * Defaults to "Raw Output" if not provided.
   * @default "Raw Output"
   */
  title?: string;
}

/**
 * Collapsible raw output viewer component.
 * 
 * Displays ADK response data as formatted JSON in a preformatted block.
 * The component renders collapsed by default and can be toggled open
 * to reveal the full JSON content.
 * 
 * @param props - Component props containing data and optional title
 * @returns React component for displaying collapsible raw JSON output
 * 
 * @example
 * ```tsx
 * <RawOutput data={adkResponse} />
 * ```
 * 
 * @example
 * ```tsx
 * <RawOutput data={adkResponse} title="API Response" />
 * ```
 */
function RawOutput({ data, title = 'Raw Output' }: RawOutputProps): JSX.Element {
  /**
   * State to track whether the raw output section is expanded.
   * Starts collapsed (false) by default for a cleaner initial UI.
   */
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  /**
   * Unique ID for the collapsible content section.
   * Used for aria-controls accessibility attribute.
   */
  const contentId = 'raw-output-content';

  /**
   * Toggle handler for expand/collapse functionality.
   * Inverts the current expanded state when the button is clicked.
   */
  const toggleExpanded = (): void => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="border border-gray-200 rounded-lg mt-6">
      {/* Toggle Button Header */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={`w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:ring-offset-1 ${
          isExpanded ? 'rounded-t-lg' : 'rounded-lg'
        }`}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        {/* Title Text */}
        <span className="text-[#3D405B] font-medium">{title}</span>

        {/* Chevron Icon with rotation animation */}
        <svg
          className={`w-5 h-5 text-[#3D405B] transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Collapsible Content Section */}
      {isExpanded && (
        <div
          id={contentId}
          className="p-4 bg-gray-50 rounded-b-lg overflow-x-auto border-t border-gray-200"
          role="region"
          aria-label={`${title} content`}
        >
          <pre className="text-sm font-mono text-[#3D405B] whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default RawOutput;
