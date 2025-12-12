/**
 * PlanView component displays the AI-generated weekend plan
 * with structured activity cards and collapsible raw output.
 */

import type { GeneratePlanResult } from '../types';
import { RawOutput } from './RawOutput';

/**
 * Props for the PlanView component
 */
export interface PlanViewProps {
  /** The plan generation result to display */
  result: GeneratePlanResult;
}

/**
 * Plan view component that renders the AI-generated weekend plan.
 * Displays the plan text with optional activity cards and a collapsible
 * raw output section for debugging.
 */
export function PlanView({ result }: PlanViewProps) {
  const { planText, rawResponse } = result;

  if (!planText) {
    return (
      <div className="p-6 text-text/60 text-center">
        <p>No plan content available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Plan content */}
      <div className="bg-white/50 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          <span aria-hidden="true">🎯</span>
          Your Weekend Plan
        </h2>
        
        {/* Render plan text with preserved formatting */}
        <div className="prose prose-text max-w-none">
          {planText.split('\n').map((paragraph, index) => (
            <p key={index} className="text-text mb-2 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Raw output section */}
      {rawResponse && <RawOutput data={rawResponse} />}
    </div>
  );
}

export default PlanView;
