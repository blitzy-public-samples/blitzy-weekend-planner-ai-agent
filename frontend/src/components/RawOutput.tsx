/**
 * RawOutput component displays a collapsible JSON viewer
 * for the raw ADK response data.
 */

import { useState } from 'react';
import type { ADKResponse } from '../types';

/**
 * Props for the RawOutput component
 */
export interface RawOutputProps {
  /** Raw ADK response data to display */
  data: ADKResponse;
}

/**
 * Collapsible raw output viewer component.
 * Displays the ADK response as formatted JSON in a preformatted block.
 * Collapsed by default to keep the UI clean.
 */
export function RawOutput({ data }: RawOutputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-text/10 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-text/70 hover:text-text flex items-center gap-2
                   focus:outline-none focus:text-text"
        aria-expanded={isExpanded}
        aria-controls="raw-output-content"
      >
        <span 
          className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
        Raw Output
      </button>

      {isExpanded && (
        <div 
          id="raw-output-content"
          className="mt-3 p-4 bg-text/5 rounded-lg overflow-x-auto"
        >
          <pre className="text-xs font-mono whitespace-pre-wrap text-text/80">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default RawOutput;
