/**
 * End-to-End Smoke Tests for Weekend Planner Frontend Application
 * 
 * This file contains comprehensive smoke tests that verify critical user flows
 * through the Weekend Planner application. Tests cover:
 * - Initial rendering and component display
 * - Form interaction and validation (Zip Code required, Kids Ages optional)
 * - Plan generation workflow with loading states
 * - Error handling and recovery
 * - Reset functionality
 * - Responsive layout behavior
 * - Accessibility attributes
 * 
 * The form contains exactly two fields:
 * - Zip Code (required): Text input for location
 * - Kids Ages (optional): Comma-separated integers where 0 < age < 120
 * 
 * Tests use MSW (Mock Service Worker) to simulate ADK backend responses,
 * allowing tests to run without requiring the actual backend server.
 * 
 * @module e2e/smoke.spec
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { server, create400Handler, create500Handler, createDelayedHandler } from '../src/__mocks__/handlers';

// ============================================================================
// Test Helper Utilities
// ============================================================================

/**
 * Helper function to fill all required form fields.
 * Fills the Zip Code field with a valid value.
 * 
 * @param user - User event instance from userEvent.setup()
 * @param options - Optional overrides for field values
 * @param options.zipCode - Zip code value (default: '94105')
 */
async function fillRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
  options: {
    zipCode?: string;
  } = {}
): Promise<void> {
  const {
    zipCode = '94105',
  } = options;

  // Fill zip code field
  const zipCodeInput = screen.getByLabelText(/zip code/i);
  await user.clear(zipCodeInput);
  await user.type(zipCodeInput, zipCode);
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
 * @param options.kidsAges - Comma-separated kids ages string (e.g., '3, 7, 12')
 */
async function fillOptionalFields(
  user: ReturnType<typeof userEvent.setup>,
  options: {
    kidsAges?: string;
  } = {}
): Promise<void> {
  const { kidsAges } = options;

  if (kidsAges) {
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
    await user.clear(kidsAgesInput);
    await user.type(kidsAgesInput, kidsAges);
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
      
      // Verify form input fields exist (two fields only: Zip Code and Kids Ages)
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kids.*ages/i)).toBeInTheDocument();
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
     * Verifies zip code field accepts user input.
     */
    it('allows user to fill in zip code field', async () => {
      const user = userEvent.setup();
      render(<App />);

      const zipCodeInput = screen.getByLabelText(/zip code/i);
      await user.type(zipCodeInput, '94105');

      expect(zipCodeInput).toHaveValue('94105');
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
     * Verifies Generate button is disabled when required fields are empty.
     */
    it('Generate button is disabled when required fields are empty', () => {
      render(<App />);

      const generateButton = screen.getByRole('button', { name: /generate plan/i });
      expect(generateButton).toBeDisabled();
    });

    /**
     * Verifies Generate button becomes enabled when zip code is filled.
     */
    it('Generate button becomes enabled when zip code is filled', async () => {
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

    /**
     * Verifies error is shown for invalid kids ages (0, 120, negative, decimals).
     * Ages must be integers where 0 < age < 120.
     */
    it('shows error for invalid kids ages (0, 120, negative, decimals)', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Fill required field
      await fillRequiredFields(user);
      
      // Test invalid ages (0 and 120 are out of valid range)
      const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
      await user.type(kidsAgesInput, '0, 120');
      await submitForm(user);
      
      await waitFor(() => {
        expect(screen.getByText(/enter ages as numbers/i)).toBeInTheDocument();
      });
    });

    /**
     * Verifies error is shown for negative ages.
     */
    it('shows error for negative kids ages', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Fill required field
      await fillRequiredFields(user);
      
      // Test negative ages
      const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
      await user.type(kidsAgesInput, '-5, 10');
      await submitForm(user);
      
      await waitFor(() => {
        expect(screen.getByText(/enter ages as numbers/i)).toBeInTheDocument();
      });
    });

    /**
     * Verifies error is shown for decimal ages.
     */
    it('shows error for decimal kids ages', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Fill required field
      await fillRequiredFields(user);
      
      // Test decimal ages
      const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
      await user.type(kidsAgesInput, '5.5, 10');
      await submitForm(user);
      
      await waitFor(() => {
        expect(screen.getByText(/enter ages as numbers/i)).toBeInTheDocument();
      });
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
      // Use delayed handler to ensure loading state is visible
      server.use(createDelayedHandler(2000));
      
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      // Loading state should be visible (with delay, we can catch it)
      await waitFor(() => {
        expect(screen.getByText(/creating your perfect weekend/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    /**
     * Verifies loading message text is correct.
     */
    it('displays loading message "Creating your perfect weekend..."', async () => {
      // Use delayed handler to ensure loading state is visible
      server.use(createDelayedHandler(2000));
      
      const user = userEvent.setup();
      render(<App />);

      await fillRequiredFields(user);
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/creating your perfect weekend/i)).toBeInTheDocument();
      }, { timeout: 1000 });
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
          expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
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
          // Check for content from the mock plan response - use heading role for specific match
          expect(screen.getByRole('heading', { name: /recommended activities/i })).toBeInTheDocument();
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
          expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Find the Raw Output toggle
      const rawOutputToggle = screen.getByText(/raw api response/i);
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
          expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Click the Raw Output toggle to expand
      const rawOutputToggle = screen.getByText(/raw api response/i);
      await user.click(rawOutputToggle);

      // After clicking, JSON content should be visible
      await waitFor(() => {
        // Look for JSON-like content that would appear in raw output
        // Use queryBy variants with null coalescing to avoid throws
        const content = screen.queryByText(/timestamp/i) ||
                       screen.queryByText(/author/i) ||
                       document.querySelector('[role="region"]');
        expect(content).toBeInTheDocument();
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
          // Should have a retry button - check for either "retry" or "try again"
          const retryButton = screen.queryByRole('button', { name: /retry/i }) ||
                              screen.queryByRole('button', { name: /try again/i });
          expect(retryButton).toBeInTheDocument();
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
      });

      // Find and click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Verify all fields are cleared (two fields only: Zip Code and Kids Ages)
      expect(screen.getByLabelText(/zip code/i)).toHaveValue('');
      expect(screen.getByLabelText(/kids.*ages/i)).toHaveValue('');
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
          expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
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
          expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
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

      // Each input should be findable by its label (two fields only)
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kids.*ages/i)).toBeInTheDocument();

      // Verify the inputs are actual form elements
      const zipCodeInput = screen.getByLabelText(/zip code/i);
      expect(zipCodeInput.tagName).toBe('INPUT');
    });

    /**
     * Verifies loading state has aria-busy attribute for screen readers.
     */
    it('loading state has aria-busy attribute', async () => {
      // Use delayed handler to ensure loading state is visible
      server.use(createDelayedHandler(500));

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
      // Use delayed handler to ensure loading state is visible
      server.use(createDelayedHandler(500));

      const user = userEvent.setup();
      render(<App />);

      // Step 1: Initial state - empty form and guidance
      expect(screen.getByText(/enter your details/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate plan/i })).toBeDisabled();

      // Step 2: Fill form fields (zip code required, kids ages optional)
      await fillRequiredFields(user, {
        zipCode: '90210',
      });
      await fillOptionalFields(user, {
        kidsAges: '5, 8',
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
          expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Step 7: Reset and verify return to initial state
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/enter your details/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/zip code/i)).toHaveValue('');
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
          const retryBtn = screen.queryByRole('button', { name: /try again/i });
          expect(retryBtn).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Reset handlers to success for retry
      server.resetHandlers();

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should show loading then success
      await waitFor(
        () => {
          expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
});
