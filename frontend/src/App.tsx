/**
 * App Component - Root React Component for Weekend Planner
 * 
 * This is the main application component that serves as the root of the
 * Weekend Planner frontend. It manages all application state and orchestrates
 * communication between the user input form and the AI-generated plan display.
 * 
 * Architecture:
 * - Uses React useState hooks for state management (isLoading, error, result)
 * - Integrates with ADK backend via createSession and generatePlan API functions
 * - Renders conditional UI based on current application state (idle, loading, error, success)
 * - Implements responsive two-column layout (40%/60% on desktop, stacked on mobile)
 * 
 * Design System:
 * - Background: #F4F1DE (warm cream)
 * - Primary CTA: #E07A5F (soft coral)
 * - Text: #3D405B (deep charcoal)
 * - Success: #81B29A (sage green)
 * - Error: #E63946 (muted red)
 * 
 * @fileoverview Root component with comprehensive state management for Weekend Planner
 */

import { useState, useCallback } from 'react';
import { createSession, generatePlan } from './api/client';
import type { GeneratePlanInput, GeneratePlanResult, PlanError } from './types';
import InputForm from './components/InputForm';
import PlanView from './components/PlanView';
import LoadingState from './components/LoadingState';
import ErrorDisplay from './components/ErrorDisplay';

/**
 * Error state interface for the App component.
 * Compatible with ErrorDisplay component's ErrorDisplayError interface.
 */
interface AppError {
  /** User-friendly or technical error message */
  message: string;
  /** HTTP status code if available */
  statusCode?: number;
  /** Raw error body for technical details */
  body?: string;
}

/**
 * Builds a natural language prompt from user input.
 * Constructs a human-readable request string that the ADK agent can process.
 * 
 * @param input - The user's form input data
 * @returns Formatted prompt string for the AI agent
 * 
 * @example
 * const input = { location: "San Francisco", startDate: "2024-03-15", endDate: "2024-03-17" };
 * buildPrompt(input); // "Plan a weekend trip to San Francisco from 2024-03-15 to 2024-03-17."
 */
function buildPrompt(input: GeneratePlanInput): string {
  let prompt = `Plan a weekend trip to ${input.location} from ${input.startDate} to ${input.endDate}.`;

  // Add kids ages if provided (used by ADK PreprocessInputAgent)
  if (input.kidsAges && input.kidsAges.trim()) {
    prompt += ` We have kids ages ${input.kidsAges}.`;
  }

  // Add preferences if provided (customizes activity recommendations)
  if (input.preferences && input.preferences.trim()) {
    prompt += ` Preferences: ${input.preferences}`;
  }

  return prompt;
}

/**
 * App Component - Main application root
 * 
 * Manages application state and coordinates the Weekend Planner workflow:
 * 1. Collects user input via InputForm component
 * 2. Creates ADK session and generates plan via API client
 * 3. Displays appropriate UI state (loading, error, or result)
 * 
 * State Management:
 * - isLoading: Boolean flag for loading state display
 * - error: Error object for error state display (null when no error)
 * - result: Plan generation result for success state display (null when no result)
 * - lastInput: Cached input for retry functionality
 * 
 * @returns The rendered application root component
 */
function App(): JSX.Element {
  // Loading state - true during API requests
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Error state - contains error details when request fails
  const [error, setError] = useState<AppError | null>(null);
  
  // Result state - contains plan data when generation succeeds
  const [result, setResult] = useState<GeneratePlanResult | null>(null);
  
  // Last input cache - used for retry functionality after errors
  const [lastInput, setLastInput] = useState<GeneratePlanInput | null>(null);

  /**
   * Handles form submission and initiates plan generation.
   * 
   * Workflow:
   * 1. Set loading state and clear previous error/result
   * 2. Create ADK session for the conversation
   * 3. Call generatePlan with user input
   * 4. Update state based on success or failure
   * 
   * @param input - The validated form input from InputForm
   */
  const handleSubmit = useCallback(async (input: GeneratePlanInput): Promise<void> => {
    // Set loading state and clear previous states
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLastInput(input);

    try {
      // Step 1: Create ADK session
      // This establishes the conversation context with the backend
      await createSession();

      // Step 2: Generate the weekend plan
      // The API client handles prompt building internally
      const planResult = await generatePlan(input);

      // Step 3: Handle the result
      if (planResult.success) {
        // Success - display the plan
        setResult(planResult);
      } else {
        // API returned an error response
        const planError: PlanError | undefined = planResult.error;
        setError({
          message: planError?.message || 'An unknown error occurred',
          statusCode: planError?.statusCode,
          body: planError?.body,
        });
      }
    } catch (err) {
      // Network or unexpected errors
      setError({
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      // Always clear loading state
      setIsLoading(false);
    }
  }, []);

  /**
   * Handles form reset.
   * Clears all application state to return to the idle state.
   */
  const handleReset = useCallback((): void => {
    setIsLoading(false);
    setError(null);
    setResult(null);
    setLastInput(null);
  }, []);

  /**
   * Handles retry after an error.
   * Re-submits the last input if available.
   */
  const handleRetry = useCallback((): void => {
    if (lastInput) {
      handleSubmit(lastInput);
    }
  }, [lastInput, handleSubmit]);

  /**
   * Renders the appropriate content for the output panel based on current state.
   * 
   * State priority (checked in order):
   * 1. Loading - shows LoadingState skeleton
   * 2. Error - shows ErrorDisplay with retry option
   * 3. Success - shows PlanView with generated plan
   * 4. Idle - shows empty state illustration with guidance
   * 
   * @returns JSX element for the current output state
   */
  const renderOutputPanel = (): JSX.Element => {
    // Loading state - show skeleton animation
    if (isLoading) {
      return <LoadingState />;
    }

    // Error state - show error with retry option
    if (error) {
      return (
        <ErrorDisplay
          error={error}
          onRetry={handleRetry}
        />
      );
    }

    // Success state - show the generated plan
    if (result && result.success) {
      return <PlanView result={result} />;
    }

    // Idle state - show empty state illustration and guidance
    return (
      <div
        className="flex flex-col items-center justify-center h-full py-12 px-6 text-center"
        role="region"
        aria-label="Getting started"
      >
        {/* Empty state illustration placeholder */}
        <div
          className="w-24 h-24 mb-6 bg-[#81B29A]/10 rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            className="w-12 h-12 text-[#81B29A]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        
        {/* Guidance heading */}
        <h2 className="text-xl font-semibold text-[#3D405B] mb-2">
          Plan Your Perfect Weekend
        </h2>
        
        {/* Guidance text */}
        <p className="text-[#3D405B]/60 max-w-sm leading-relaxed">
          Enter your details and click Generate Plan to get personalized 
          weekend activity recommendations powered by AI.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F1DE]">
      {/* Application Header */}
      <header className="py-6 px-4 md:px-8 border-b border-[#3D405B]/10">
        <div className="max-w-[1200px] mx-auto">
          {/* Main title with primary brand color */}
          <h1 className="text-3xl font-bold text-[#E07A5F]">
            Weekend Planner
          </h1>
          {/* Subtitle with muted text */}
          <p className="text-gray-500 mt-1">
            Plan the perfect family weekend with AI
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto p-4 md:p-8">
        {/* Responsive two-column layout:
            - Mobile: stacked single column
            - Desktop (md+): side-by-side with 40%/60% split */}
        <div className="md:flex md:gap-8">
          {/* Left Column - Input Form (40% on desktop) */}
          <div className="md:w-2/5 mb-6 md:mb-0">
            <InputForm
              onSubmit={handleSubmit}
              onReset={handleReset}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Output Panel (60% on desktop) */}
          <div className="md:w-3/5 min-h-[400px]">
            {renderOutputPanel()}
          </div>
        </div>
      </main>

      {/* Application Footer */}
      <footer className="py-4 px-4 text-center text-sm text-[#3D405B]/60 border-t border-[#3D405B]/10 mt-8">
        <p>
          Powered by Google ADK and Gemini AI
        </p>
      </footer>
    </div>
  );
}

export default App;
