/**
 * PlanView Component
 * 
 * React functional component for displaying AI-generated weekend plans.
 * Renders structured activity cards with plan content and integrates the
 * RawOutput component for collapsible raw API response viewing.
 * 
 * Features:
 * - Displays formatted plan text content from planText prop
 * - Attempts to parse and display structured activity cards when data is parseable
 * - Falls back to displaying raw text content gracefully for unstructured responses
 * - Includes collapsible Raw Output section (collapsed by default)
 * - Full accessibility support with ARIA attributes
 * - Responsive design using Tailwind CSS
 * 
 * Design System Colors:
 * - Success/Header: #81B29A (sage green)
 * - Text: #3D405B (deep charcoal)
 * - Background: white
 * 
 * @fileoverview Weekend plan display component with activity cards and raw output viewer
 */

import React from 'react';
import RawOutput from './RawOutput';
import type { ADKResponse } from '../types';

/**
 * Represents a parsed activity from the plan text.
 * Used when the AI response can be structured into distinct activities.
 */
interface ParsedActivity {
  /** Title or name of the activity */
  title: string;
  /** Detailed description of the activity */
  description: string;
  /** Optional category or type of activity */
  category?: string;
}

/**
 * Represents parsed plan data when structured format is detected.
 * Contains header information and a list of activities.
 */
interface ParsedPlanData {
  /** Header text (area, weather, ages info) */
  header?: string;
  /** List of parsed activities */
  activities: ParsedActivity[];
  /** Disclaimer text from the AI response */
  disclaimer?: string;
  /** Any remaining unstructured content */
  remainingContent?: string;
}

/**
 * Props interface for the PlanView component.
 * Defines the required result property containing plan generation data.
 */
export interface PlanViewProps {
  /**
   * The plan generation result containing the plan text and raw API response.
   * Must include planText for display and optionally rawResponse for the
   * collapsible raw output section.
   */
  result: {
    /** Extracted plan text content from the AI response */
    planText?: string;
    /** Raw ADK response for debugging display */
    rawResponse?: ADKResponse;
  };
}

/**
 * Attempts to parse the plan text into structured activity data.
 * Looks for bullet points, numbered lists, and other structural patterns
 * in the AI response to create activity cards.
 * 
 * @param planText - The raw plan text from the AI response
 * @returns ParsedPlanData if structure is detected, null otherwise
 */
function parsePlanStructure(planText: string): ParsedPlanData | null {
  if (!planText || typeof planText !== 'string') {
    return null;
  }

  const lines = planText.split('\n').map((line) => line.trim()).filter(Boolean);
  
  if (lines.length === 0) {
    return null;
  }

  const activities: ParsedActivity[] = [];
  let header = '';
  let disclaimer = '';
  let currentActivity: Partial<ParsedActivity> | null = null;

  // Patterns for detecting structured content
  const bulletPattern = /^[-•*]\s+(.+)/;
  const numberedPattern = /^\d+[.)]\s+(.+)/;
  const headerPattern = /^(area|weather|ages|location|forecast)/i;
  const disclaimerPattern = /disclaimer|note:|based on ai|verify|accuracy/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for disclaimer
    if (disclaimerPattern.test(line)) {
      disclaimer = line;
      continue;
    }

    // Check for header information (usually at the start)
    if (i < 3 && headerPattern.test(line)) {
      header = header ? `${header}\n${line}` : line;
      continue;
    }

    // Check for bullet points
    const bulletMatch = line.match(bulletPattern);
    if (bulletMatch) {
      // Save previous activity if exists
      if (currentActivity && currentActivity.title) {
        activities.push(currentActivity as ParsedActivity);
      }
      
      currentActivity = {
        title: bulletMatch[1],
        description: '',
      };
      continue;
    }

    // Check for numbered items
    const numberedMatch = line.match(numberedPattern);
    if (numberedMatch) {
      // Save previous activity if exists
      if (currentActivity && currentActivity.title) {
        activities.push(currentActivity as ParsedActivity);
      }
      
      currentActivity = {
        title: numberedMatch[1],
        description: '',
      };
      continue;
    }

    // If we have a current activity, append as description
    if (currentActivity) {
      currentActivity.description = currentActivity.description
        ? `${currentActivity.description} ${line}`
        : line;
    } else if (i < 5) {
      // Early lines without structure might be header
      header = header ? `${header}\n${line}` : line;
    }
  }

  // Push the last activity
  if (currentActivity && currentActivity.title) {
    activities.push(currentActivity as ParsedActivity);
  }

  // Only return structured data if we found activities
  if (activities.length >= 2) {
    return {
      header: header || undefined,
      activities,
      disclaimer: disclaimer || undefined,
    };
  }

  return null;
}

/**
 * Activity Card Component
 * 
 * Renders a single activity as a styled card with title and description.
 * Uses the success color scheme for visual consistency.
 */
function ActivityCard({ activity, index }: { activity: ParsedActivity; index: number }): JSX.Element {
  return (
    <div
      className="bg-white border border-[#81B29A]/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
      role="listitem"
      aria-label={`Activity ${index + 1}: ${activity.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Activity number badge */}
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full bg-[#81B29A] text-white flex items-center justify-center font-semibold text-sm"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        
        <div className="flex-1 min-w-0">
          {/* Activity title */}
          <h4 className="text-[#3D405B] font-semibold text-base leading-tight mb-1">
            {activity.title}
          </h4>
          
          {/* Activity description */}
          {activity.description && (
            <p className="text-[#3D405B]/70 text-sm leading-relaxed">
              {activity.description}
            </p>
          )}
          
          {/* Activity category badge */}
          {activity.category && (
            <span className="inline-block mt-2 px-2 py-1 bg-[#81B29A]/10 text-[#81B29A] text-xs font-medium rounded">
              {activity.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PlanView Component
 * 
 * Main component for displaying AI-generated weekend plans.
 * Attempts to parse the plan text into structured activity cards,
 * falling back to formatted text display for unstructured responses.
 * 
 * @param props - Component props containing the plan generation result
 * @returns React component for displaying the weekend plan
 * 
 * @example
 * ```tsx
 * <PlanView result={{
 *   planText: "Your weekend plan for San Francisco...",
 *   rawResponse: adkEvents
 * }} />
 * ```
 */
export function PlanView({ result }: PlanViewProps): JSX.Element {
  const { planText, rawResponse } = result;

  // Handle empty or missing plan text
  if (!planText || planText.trim().length === 0) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-xl p-6"
        role="article"
        aria-label="Weekend plan - empty"
      >
        <div className="text-center py-8">
          <div
            className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-[#3D405B]/60 text-base">
            No plan content available
          </p>
          <p className="text-[#3D405B]/40 text-sm mt-1">
            Try generating a new plan with your preferences
          </p>
        </div>
      </div>
    );
  }

  // Attempt to parse structured content
  const parsedData = parsePlanStructure(planText);

  return (
    <div
      className="bg-white border border-[#81B29A] rounded-xl p-6"
      role="article"
      aria-label="Your weekend plan"
    >
      {/* Header section with success color */}
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-[#81B29A] flex items-center gap-3">
          <span
            className="w-10 h-10 bg-[#81B29A]/10 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="w-6 h-6 text-[#81B29A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </span>
          Your Weekend Plan
        </h2>
        
        {/* Display parsed header info if available */}
        {parsedData?.header && (
          <div className="mt-3 p-3 bg-[#81B29A]/5 rounded-lg border border-[#81B29A]/20">
            <p className="text-[#3D405B] text-sm whitespace-pre-line">
              {parsedData.header}
            </p>
          </div>
        )}
      </header>

      {/* Main content area */}
      <div className="space-y-4">
        {parsedData && parsedData.activities.length > 0 ? (
          // Render structured activity cards
          <>
            <section aria-label="Activity recommendations">
              <h3 className="sr-only">Recommended Activities</h3>
              <div
                className="space-y-3"
                role="list"
                aria-label="List of activities"
              >
                {parsedData.activities.map((activity, index) => (
                  <ActivityCard
                    key={`activity-${index}`}
                    activity={activity}
                    index={index}
                  />
                ))}
              </div>
            </section>

            {/* Remaining unstructured content if any */}
            {parsedData.remainingContent && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[#3D405B] text-sm whitespace-pre-wrap leading-relaxed">
                  {parsedData.remainingContent}
                </p>
              </div>
            )}
          </>
        ) : (
          // Fallback: Display unstructured text with formatting preserved
          <div
            className="prose prose-sm max-w-none"
            aria-label="Plan details"
          >
            <div className="text-[#3D405B] whitespace-pre-wrap leading-relaxed text-base">
              {planText}
            </div>
          </div>
        )}

        {/* Disclaimer section if present */}
        {parsedData?.disclaimer && (
          <aside
            className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            role="note"
            aria-label="Important disclaimer"
          >
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-amber-800 text-sm">
                {parsedData.disclaimer}
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Raw Output section - collapsed by default */}
      {rawResponse && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <RawOutput data={rawResponse} title="Raw API Response" />
        </div>
      )}
    </div>
  );
}

export default PlanView;
