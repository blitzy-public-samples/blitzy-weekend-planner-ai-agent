/**
 * App component - Root component for the Weekend Planner frontend.
 * Manages application state and coordinates between form input and plan display.
 */

import { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { PlanView } from './components/PlanView';
import { LoadingState } from './components/LoadingState';
import { ErrorDisplay } from './components/ErrorDisplay';
import { generatePlan } from './api/client';
import type { GeneratePlanInput, GeneratePlanResult, ApiError } from './types';
import './index.css';

/**
 * Application state type
 */
type AppState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Main application component.
 * Renders the Weekend Planner interface with form input and plan output panels.
 */
function App() {
  // Application state
  const [appState, setAppState] = useState<AppState>('idle');
  const [result, setResult] = useState<GeneratePlanResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastInput, setLastInput] = useState<GeneratePlanInput | null>(null);

  /**
   * Handles form submission and plan generation
   */
  const handleSubmit = useCallback(async (input: GeneratePlanInput) => {
    setAppState('loading');
    setError(null);
    setLastInput(input);

    try {
      const planResult = await generatePlan(input);

      if (planResult.success) {
        setResult(planResult);
        setAppState('success');
      } else {
        setError(planResult.error || { message: 'An unknown error occurred' });
        setAppState('error');
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'An unexpected error occurred'
      });
      setAppState('error');
    }
  }, []);

  /**
   * Handles form reset
   */
  const handleReset = useCallback(() => {
    setAppState('idle');
    setResult(null);
    setError(null);
    setLastInput(null);
  }, []);

  /**
   * Handles retry after error
   */
  const handleRetry = useCallback(() => {
    if (lastInput) {
      handleSubmit(lastInput);
    }
  }, [lastInput, handleSubmit]);

  /**
   * Renders the output panel based on current state
   */
  const renderOutput = () => {
    switch (appState) {
      case 'loading':
        return <LoadingState />;
      
      case 'error':
        return error && <ErrorDisplay error={error} onRetry={handleRetry} />;
      
      case 'success':
        return result && <PlanView result={result} />;
      
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <span className="text-6xl mb-4" aria-hidden="true">🌴</span>
            <h2 className="text-xl font-medium text-text mb-2">
              Plan Your Perfect Weekend
            </h2>
            <p className="text-text/60 max-w-sm">
              Enter your details and click Generate Plan to get personalized 
              weekend activity recommendations powered by AI.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-6 px-4 border-b border-text/10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-primary">Weekend Planner</h1>
          <p className="text-gray-500 mt-1">
            Plan the perfect family weekend with AI
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 min-h-[600px]">
          {/* Form panel - 40% on desktop */}
          <div className="md:col-span-2 bg-white/30 rounded-xl shadow-sm">
            <InputForm 
              onSubmit={handleSubmit}
              onReset={handleReset}
              isLoading={appState === 'loading'}
            />
          </div>

          {/* Output panel - 60% on desktop */}
          <div className="md:col-span-3 bg-white/30 rounded-xl shadow-sm min-h-[400px]">
            {renderOutput()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-sm text-text/60 border-t border-text/10 mt-8">
        <p>
          Powered by Google ADK and Gemini AI
        </p>
      </footer>
    </div>
  );
}

export default App;
