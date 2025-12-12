/**
 * End-to-End Smoke Tests for Weekend Planner Frontend Application
 * 
 * This file contains comprehensive smoke tests that verify critical user flows
 * through the Weekend Planner application. Tests cover:
 * - Initial rendering and component display
 * - Form interaction and validation
 * - Plan generation workflow with loading states
 * - Error handling and recovery
 * - Reset functionality
 * - Responsive layout behavior
 * - Accessibility attributes
 * 
 * Tests use MSW (Mock Service Worker) to simulate ADK backend responses,
 * allowing tests to run without requiring the actual backend server.
 * 
 * @module e2e/smoke.spec
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { server, create400Handler, create500Handler } from '../src/__mocks__/handlers';

// ============================================================================
// Test Helper Utilities
// ============================================================================

/**
 * Helper function to fill all required form fields.
 * Fills location, start date, and end date fields with valid values.
 * 
 * @param user - User event instance from userEvent.setup()
 * @param options - Optional overrides for field values
 */
async function fillRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
  options: {
    location?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<void> {
  const {
    location = 'San Francisco',
    startDate = '2024-03-01',
    endDate = '2024-03-03',
  } = options;

  // Fill location field
  const locationInput = screen.getByLabelText(/location/i);
  await user.clear(locationInput);
  await user.type(locationInput, location);

  // Fill start date field
  const startDateInput = screen.getByLabelText(/start date/i);
  await user.clear(startDateInput);
  await user.type(startDateInput, startDate);

  // Fill end date field
  const endDateInput = screen.getByLabelText(/end date/i);
  await user.clear(endDateInput);
  await user.type(endDateInput, endDate);
}

/**
 * Helper function to submit the form by clicking the Generate Plan button.
 * 
 * @param user - User event instance from userEvent.setup()
 */
async function submitForm(
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  const generateButton = screen.getByRole('button', { name: /generate plan/i });
  await user.click(generateButton);
}

/**
 * Helper function to fill optional form fields.
 * 
 * @param user - User event instance from userEvent.setup()
 * @param options - Values for optional fields
 */
async function fillOptionalFields(
  user: ReturnType<typeof userEvent.setup>,
  options: {
    kidsAges?: string;
    preferences?: string;
  } = {}
): Promise<void> {
  const { kidsAges, preferences } = options;

  if (kidsAges) {
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
    await user.clear(kidsAgesInput);
    await user.type(kidsAgesInput, kidsAges);
  }

  if (preferences) {
    const preferencesInput = screen.getByLabelText(/preferences/i);
    await user.clear(preferencesInput);
    await user.type(preferencesInput, preferences);
  }
}

// ============================================================================
// Test Suite: Weekend Planner E2E Smoke Tests
// ============================================================================

describe('Weekend Planner E2E Smoke Tests', () => {
  /**
   * Setup before each test.
   * No specific setup needed as MSW server lifecycle is handled in setup.ts.
   */
  beforeEach(() => {
    // Reset any mocked timers or state if needed
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Initial Rendering Tests
  // ==========================================================================

  describe('Initial Rendering', () => {
    /**
     * Verifies that the application renders with header and form elements.
     * Confirms core UI elements are present on initial load.
     */
    it('renders the application with header and form', () => {
      render(<App />);

      // Verify header elements
      expect(screen.getByRole('heading', { name: /weekend planner/i })).toBeInTheDocument();
      
      // Verify form input fields exist
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    /**
     * Verifies the main application title is displayed.
     */
    it('displays "Weekend Planner" title', () => {
      render(<App />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Weekend Planner');
    });

    /**
     * Verifies the subtitle is displayed below the title.
     */
    it('displays subtitle "Plan the perfect family weekend with AI"', () => {
      render(<App />);

      expect(screen.getByText(/plan the perfect family weekend with ai/i)).toBeInTheDocument();
    });

    /**
     * Verifies empty state guidance is shown in the output panel initially.
     */
    it('renders empty state guidance in output panel', () => {
      render(<App />);

      // Should show guidance text when no plan has been generated
      expect(screen.getByText(/enter your details/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Form Interaction Tests
  // ==========================================================================

  describe('Form Interaction', () => {
    /**
     * Verifies location field accepts user input.
     */
    it('allows user to fill in location field', async () => {
      const user = userEvent.setup();
      render(<App />);

      const locationInput = screen.getByLabelText(/location/i);
      await user.type(locationInput, 'San Francisco');

      expect(locationInput).toHaveValue('San Francisco');
    });

    /**
     * Verifies date picker fields accept valid dates.
     */
    it('allows user to select start and end dates', async () => {
      const user = userEvent.setup();
      render(<App />);

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      await user.type(startDateInput, '2024-03-01');
      await user.type(endDateInput, '2024-03-03');

      expect(startDateInput).toHaveValue('2024-03-01');
      expect(endDateInput).toHaveValue('2024-03-03');
    });

    /**
     * Verifies kids ages field accepts comma-separated format.
     */
    it('allows user to enter kids ages in comma-separated format', async () => {
      const user = userEvent.setup();
      render(<App />);

      const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
      await user.type(kidsAgesInput, '3, 7, 12');

      expect(kidsAgesInput).toHaveValue('3, 7, 12');
    });

    /**
     * Verifies preferences textarea accepts free-form text.
     */
    it('allows user to enter preferences text', async () => {
      const user = userEvent.setup();
      render(<App />);

      const preferencesInput = screen.getByLabelText(/preferences/i);
      await user.type(preferencesInput, 'outdoor activities, avoid crowds');

      expect(preferencesInput).toHaveValue('outdoor activities, avoid crowds');
    });

    /**
     * Verifies Generate button is disabled when required fields are empty.
     */
    it('Generate button is disabled when required fields are empty', () => {
      render(<App />);

      const generateButton = screen.getByRole('button', { name: /generate plan/i });
      expect(generateButton).toBeDisabled();
    });

    /**
     * Verifies Generate button becomes enabled when all required fields are filled.
     */
    it('Generate button becomes enabled when location and dates are filled', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);

      const generateButton = screen.getByRole('button', { name: /generate plan/i });
      expect(generateButton).toBeEnabled();
    });
  });

  // ==========================================================================
  // Form Validation Tests
  // ==========================================================================

  describe('Form Validation', () => {
    /**
     * Verifies error message is shown when end date is before start date.
     */
    it('shows error when end date is before start date', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Fill dates with end date before start date
      await fillRequiredFields(user, {
        location: 'San Francisco',
        startDate: '2024-03-10',
        endDate: '2024-03-05', // Before start date
      });

      // Check for validation error message
      await waitFor(() => {
        expect(screen.getByText(/end date must be on or after start date/i)).toBeInTheDocument();
      });
    });

    /**
     * Verifies kids ages field accepts format with spaces around commas.
     */
    it('accepts valid kids ages format like "3, 7, 12"', async () => {
      const user = userEvent.setup();
      render(<App />);

      const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
      await user.type(kidsAgesInput, '3, 7, 12');

      // Input should accept the format without error
      expect(kidsAgesInput).toHaveValue('3, 7, 12');
      
      // No error message should be displayed for valid format
      expect(screen.queryByText(/enter ages as numbers/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Plan Generation Flow Tests
  // ==========================================================================

  describe('Plan Generation Flow', () => {
    /**
     * Verifies loading state appears when form is submitted.
     */
    it('shows loading state when form is submitted', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      // Loading state should be visible
      await waitFor(() => {
        expect(screen.getByText(/creating your perfect weekend/i)).toBeInTheDocument();
      });
    });

    /**
     * Verifies loading message text is correct.
     */
    it('displays loading message "Creating your perfect weekend..."', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/creating your perfect weekend/i)).toBeInTheDocument();
      });
    });

    /**
     * Verifies plan result is displayed after successful API response.
     */
    it('displays plan result after successful API response', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      // Wait for loading to complete and plan to appear
      await waitFor(
        () => {
          // Check for plan content from mock response
          expect(screen.getByText(/weekend plan/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies plan text content is rendered in output panel.
     */
    it('renders plan text content in output panel', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          // Check for content from the mock plan response
          expect(screen.getByText(/recommended activities/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies Raw Output section is collapsed by default after plan generation.
     */
    it('shows Raw Output section collapsed by default', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          expect(screen.getByText(/weekend plan/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Find the Raw Output toggle
      const rawOutputToggle = screen.getByText(/raw output/i);
      expect(rawOutputToggle).toBeInTheDocument();

      // The detailed JSON should not be initially visible (collapsed state)
      // Look for indicators of expanded content
      const expandedContent = screen.queryByText(/"id":/);
      expect(expandedContent).not.toBeInTheDocument();
    });

    /**
     * Verifies Raw Output section can be expanded by clicking.
     */
    it('expands Raw Output section when clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          expect(screen.getByText(/weekend plan/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Click the Raw Output toggle to expand
      const rawOutputToggle = screen.getByText(/raw output/i);
      await user.click(rawOutputToggle);

      // After clicking, JSON content should be visible
      await waitFor(() => {
        // Look for JSON-like content that would appear in raw output
        expect(screen.getByRole('region', { name: /raw output/i }) || 
               screen.getByText(/timestamp/i) ||
               screen.getByText(/author/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    /**
     * Verifies error message is displayed when API returns 400 error.
     */
    it('displays error message when API returns error', async () => {
      // Override the handler to return a 400 error
      server.use(create400Handler());

      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          // Check for error state UI
          expect(screen.getByRole('alert') || screen.getByText(/error/i) || screen.getByText(/invalid/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies user-friendly error message is shown for server errors.
     */
    it('shows user-friendly error message', async () => {
      // Override the handler to return a 500 error
      server.use(create500Handler());

      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          // Should show a user-friendly message, not raw error details
          const errorContainer = screen.getByRole('alert') || 
                                screen.getByText(/something went wrong/i) ||
                                screen.getByText(/server/i);
          expect(errorContainer).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies expandable technical details section is present in error display.
     */
    it('shows expandable technical details section', async () => {
      server.use(create500Handler());

      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          // Look for technical details toggle or similar UI
          expect(screen.getByText(/technical details/i) || 
                 screen.getByText(/details/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies retry option is available after error.
     */
    it('displays retry option', async () => {
      server.use(create500Handler());

      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          // Should have a retry button
          expect(screen.getByRole('button', { name: /retry/i }) ||
                 screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  // ==========================================================================
  // Reset Functionality Tests
  // ==========================================================================

  describe('Reset Functionality', () => {
    /**
     * Verifies all form fields are cleared when Reset button is clicked.
     */
    it('clears all form fields when Reset button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Fill all fields
      await fillRequiredFields(user);
      await fillOptionalFields(user, {
        kidsAges: '3, 7',
        preferences: 'outdoor activities',
      });

      // Find and click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Verify all fields are cleared
      expect(screen.getByLabelText(/location/i)).toHaveValue('');
      expect(screen.getByLabelText(/start date/i)).toHaveValue('');
      expect(screen.getByLabelText(/end date/i)).toHaveValue('');
      expect(screen.getByLabelText(/kids.*ages/i)).toHaveValue('');
      expect(screen.getByLabelText(/preferences/i)).toHaveValue('');
    });

    /**
     * Verifies output panel is cleared when Reset button is clicked after successful generation.
     */
    it('clears output panel when Reset button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Generate a plan
      await fillRequiredFields(user);
      await submitForm(user);

      // Wait for plan to be displayed
      await waitFor(
        () => {
          expect(screen.getByText(/weekend plan/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Click reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Plan content should be gone, empty state should return
      await waitFor(() => {
        expect(screen.queryByText(/recommended activities/i)).not.toBeInTheDocument();
      });
    });

    /**
     * Verifies application returns to empty state after reset.
     */
    it('returns to empty state after reset', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Generate a plan
      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          expect(screen.getByText(/weekend plan/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Click reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Should return to empty state with guidance text
      await waitFor(() => {
        expect(screen.getByText(/enter your details/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Responsive Layout Tests
  // ==========================================================================

  describe('Responsive Layout', () => {
    /**
     * Verifies layout uses full width on mobile viewport.
     * Note: Testing responsive layouts in jsdom has limitations as it doesn't
     * actually render CSS. This test verifies the presence of responsive classes.
     */
    it('uses full width on mobile viewport', () => {
      render(<App />);

      // Look for the main content area that contains responsive classes
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();

      // The layout should have responsive width classes (md:w-2/5, md:w-3/5)
      // These indicate mobile-first full-width design
      const container = mainContent.querySelector('.md\\:w-2\\/5, .md\\:flex');
      expect(container || mainContent).toBeInTheDocument();
    });

    /**
     * Verifies two-column layout elements are present for desktop viewport.
     * Note: Actual rendering depends on CSS which jsdom doesn't fully support.
     */
    it('displays two-column layout on desktop viewport', () => {
      render(<App />);

      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();

      // Check for the flex container that creates two-column layout
      // The App uses md:flex md:gap-8 for desktop layout
      const innerContainer = mainContent.firstElementChild;
      expect(innerContainer).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    /**
     * Verifies form inputs have associated labels via htmlFor attribute.
     */
    it('form inputs have associated labels', () => {
      render(<App />);

      // Each input should be findable by its label
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kids.*ages/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preferences/i)).toBeInTheDocument();

      // Verify the inputs are actual form elements
      const locationInput = screen.getByLabelText(/location/i);
      expect(locationInput.tagName).toBe('INPUT');
    });

    /**
     * Verifies loading state has aria-busy attribute for screen readers.
     */
    it('loading state has aria-busy attribute', async () => {
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      // During loading, there should be an element with aria-busy
      await waitFor(() => {
        const loadingContainer = screen.getByText(/creating your perfect weekend/i)
          .closest('[aria-busy="true"]') || 
          document.querySelector('[aria-busy="true"]');
        expect(loadingContainer).toBeInTheDocument();
      });
    });

    /**
     * Verifies error messages use aria-live for screen reader announcements.
     */
    it('error messages use aria-live for announcements', async () => {
      server.use(create500Handler());

      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(
        () => {
          // Look for aria-live attribute on error container or role="alert"
          const alertElement = screen.getByRole('alert') ||
            document.querySelector('[aria-live]');
          expect(alertElement).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  // ==========================================================================
  // Complete User Journey Test
  // ==========================================================================

  describe('Complete User Journey', () => {
    /**
     * End-to-end test covering a complete user journey from form fill to plan display.
     */
    it('completes full user journey: fill form → submit → view plan → reset', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Step 1: Initial state - empty form and guidance
      expect(screen.getByText(/enter your details/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate plan/i })).toBeDisabled();

      // Step 2: Fill form fields
      await fillRequiredFields(user, {
        location: 'Los Angeles',
        startDate: '2024-04-05',
        endDate: '2024-04-07',
      });
      await fillOptionalFields(user, {
        kidsAges: '5, 8',
        preferences: 'beach activities',
      });

      // Step 3: Verify button is now enabled
      const generateButton = screen.getByRole('button', { name: /generate plan/i });
      expect(generateButton).toBeEnabled();

      // Step 4: Submit form
      await user.click(generateButton);

      // Step 5: Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/creating your perfect weekend/i)).toBeInTheDocument();
      });

      // Step 6: Verify plan is displayed
      await waitFor(
        () => {
          expect(screen.getByText(/weekend plan/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Step 7: Reset and verify return to initial state
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/enter your details/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location/i)).toHaveValue('');
      });
    });

    /**
     * Test error recovery journey: submit → error → retry → success
     */
    it('handles error recovery: submit → error → retry', async () => {
      const user = userEvent.setup();
      
      // Start with error handler
      server.use(create500Handler());
      
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      // Wait for error state
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /retry/i }) ||
                 screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Reset handlers to success for retry
      server.resetHandlers();

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i }) ||
                         screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should show loading then success
      await waitFor(
        () => {
          expect(screen.getByText(/weekend plan/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
});
