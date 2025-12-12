/**
 * InputForm Component Unit Tests
 * 
 * Comprehensive test suite for the InputForm component validating:
 * - Form field rendering (location, dates, kids ages, preferences)
 * - Form validation logic (required fields, date comparison)
 * - Submit and reset functionality
 * - Input format acceptance
 * 
 * Uses Vitest as the test runner with React Testing Library for component testing
 * and userEvent for realistic user interaction simulation.
 * 
 * Test Coverage: 9 test cases
 * 
 * @module __tests__/components/InputForm.test
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import InputForm from '../../components/InputForm';

/**
 * InputForm Component Test Suite
 * 
 * Tests all aspects of the InputForm component including:
 * - Required field rendering
 * - Optional field rendering
 * - Button state management (enabled/disabled)
 * - Validation error display
 * - Form submission with correct data structure
 * - Form reset functionality
 * - Special input format handling
 */
describe('InputForm', () => {
  /**
   * Mock function to track form submissions.
   * Reset before each test to ensure isolation.
   */
  const mockOnSubmit = vi.fn();

  /**
   * Mock function to track form resets.
   * Reset before each test to ensure isolation.
   */
  const mockOnReset = vi.fn();

  /**
   * Setup hook to reset mock functions before each test.
   * Ensures test isolation and clean state.
   */
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnReset.mockClear();
  });

  /**
   * Cleanup hook after each test.
   * Ensures no state leaks between tests.
   */
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Test Case 1: Required Field Rendering
  // ============================================================================

  /**
   * Test Case 1: Renders location, start date, end date fields
   * 
   * Verifies that all required input fields are present in the DOM
   * with proper labels for accessibility compliance.
   * 
   * Fields tested:
   * - Location (text input)
   * - Start Date (date input)
   * - End Date (date input)
   */
  it('renders location, start date, end date fields', () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Assert that location input is present and accessible by label
    const locationInput = screen.getByLabelText(/location/i);
    expect(locationInput).toBeInTheDocument();
    expect(locationInput).toHaveAttribute('type', 'text');

    // Assert that start date input is present and accessible by label
    const startDateInput = screen.getByLabelText(/start date/i);
    expect(startDateInput).toBeInTheDocument();
    expect(startDateInput).toHaveAttribute('type', 'date');

    // Assert that end date input is present and accessible by label
    const endDateInput = screen.getByLabelText(/end date/i);
    expect(endDateInput).toBeInTheDocument();
    expect(endDateInput).toHaveAttribute('type', 'date');
  });

  // ============================================================================
  // Test Case 2: Optional Field Rendering
  // ============================================================================

  /**
   * Test Case 2: Renders optional kids ages and preferences fields
   * 
   * Verifies that optional fields are present in the DOM.
   * These fields are not required for form submission but enhance
   * the weekend planning experience.
   * 
   * Fields tested:
   * - Kids Ages (text input for comma-separated ages)
   * - Preferences (textarea for activity preferences)
   */
  it('renders optional kids ages and preferences fields', () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Assert that kids ages input is present
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);
    expect(kidsAgesInput).toBeInTheDocument();
    expect(kidsAgesInput).toHaveAttribute('type', 'text');

    // Assert that preferences textarea is present
    const preferencesInput = screen.getByLabelText(/preferences/i);
    expect(preferencesInput).toBeInTheDocument();
    expect(preferencesInput.tagName.toLowerCase()).toBe('textarea');
  });

  // ============================================================================
  // Test Case 3: Generate Button Disabled When Location Empty
  // ============================================================================

  /**
   * Test Case 3: Generate button disabled when location empty
   * 
   * Verifies that the Generate Plan button is disabled when the
   * required location field is empty. This prevents form submission
   * without required data.
   */
  it('Generate button disabled when location empty', () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Find the submit button by its accessible name
    const submitButton = screen.getByRole('button', { name: /generate plan/i });

    // Assert that button is disabled when location is empty
    expect(submitButton).toBeDisabled();

    // Verify that aria-disabled attribute is also set for accessibility
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
  });

  // ============================================================================
  // Test Case 4: Generate Button Disabled When Dates Missing
  // ============================================================================

  /**
   * Test Case 4: Generate button disabled when dates missing
   * 
   * Verifies that even when location is filled, the Generate Plan button
   * remains disabled if the required date fields are not filled.
   * Uses userEvent for realistic input simulation.
   */
  it('Generate button disabled when dates missing', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Fill in the location field and wait for state update
    const locationInput = screen.getByLabelText(/location/i);
    await user.type(locationInput, 'San Francisco');

    // Wait for all state updates to complete
    await waitFor(() => {
      expect(locationInput).toHaveValue('San Francisco');
    });

    // Verify button remains disabled when dates are missing
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeDisabled();
  });

  // ============================================================================
  // Test Case 5: Shows Inline Error When End Date < Start Date
  // ============================================================================

  /**
   * Test Case 5: Shows inline error when end date < start date
   * 
   * Verifies that form validation catches invalid date ranges where
   * the end date is before the start date. The error message should
   * be displayed inline near the end date field.
   * 
   * Expected error message: "End date must be on or after start date"
   */
  it('shows inline error when end date < start date', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to all required input fields
    const locationInput = screen.getByLabelText(/location/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    // Fill in location to enable submit button consideration
    await user.type(locationInput, 'San Francisco');

    // Set start date to a later date
    await user.type(startDateInput, '2024-03-20');

    // Set end date to an earlier date (invalid)
    await user.type(endDateInput, '2024-03-15');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(endDateInput).toHaveValue('2024-03-15');
    });

    // Trigger form submission to activate validation
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Wait for and verify the error message appears
    await waitFor(() => {
      const errorMessage = screen.getByText(/end date must be on or after start date/i);
      expect(errorMessage).toBeInTheDocument();
    });

    // Additionally verify aria-invalid is set on the end date input
    expect(endDateInput).toHaveAttribute('aria-invalid', 'true');

    // Verify that onSubmit was NOT called due to validation failure
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Test Case 6: Generate Button Enabled When Required Fields Valid
  // ============================================================================

  /**
   * Test Case 6: Generate button enabled when required fields valid
   * 
   * Verifies that the Generate Plan button becomes enabled when all
   * required fields (location, start date, end date) are filled with
   * valid values.
   */
  it('Generate button enabled when required fields valid', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const locationInput = screen.getByLabelText(/location/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    // Fill in all required fields with valid data
    await user.type(locationInput, 'San Francisco');
    await user.type(startDateInput, '2024-03-15');
    await user.type(endDateInput, '2024-03-17');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(endDateInput).toHaveValue('2024-03-17');
    });

    // Verify button is now enabled
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveAttribute('aria-disabled', 'false');
  });

  // ============================================================================
  // Test Case 7: Calls onSubmit with Correct GeneratePlanInput Structure
  // ============================================================================

  /**
   * Test Case 7: Calls onSubmit with correct GeneratePlanInput structure
   * 
   * Verifies that when the form is submitted with valid data, the onSubmit
   * callback is called with a properly structured GeneratePlanInput object
   * containing all form field values.
   * 
   * Expected structure:
   * {
   *   location: string,
   *   startDate: string (YYYY-MM-DD),
   *   endDate: string (YYYY-MM-DD),
   *   kidsAges?: string,
   *   preferences?: string
   * }
   */
  it('calls onSubmit with correct GeneratePlanInput structure', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const locationInput = screen.getByLabelText(/location/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);
    const preferencesInput = screen.getByLabelText(/preferences/i);

    // Fill in all form fields including optional ones
    await user.type(locationInput, 'San Francisco');
    await user.type(startDateInput, '2024-03-15');
    await user.type(endDateInput, '2024-03-17');
    await user.type(kidsAgesInput, '5, 8');
    await user.type(preferencesInput, 'outdoor activities');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(preferencesInput).toHaveValue('outdoor activities');
    });

    // Click the submit button to trigger form submission
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Wait for the submission callback and verify correct data structure
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        location: 'San Francisco',
        startDate: '2024-03-15',
        endDate: '2024-03-17',
        kidsAges: '5, 8',
        preferences: 'outdoor activities'
      });
    });
  });

  // ============================================================================
  // Test Case 8: Reset Button Clears All Field Values
  // ============================================================================

  /**
   * Test Case 8: Reset button clears all field values
   * 
   * Verifies that clicking the Reset button:
   * 1. Clears all form field values (including optional fields)
   * 2. Calls the onReset callback
   * 3. Clears any validation errors
   */
  it('Reset button clears all field values', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to all form fields
    const locationInput = screen.getByLabelText(/location/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);
    const preferencesInput = screen.getByLabelText(/preferences/i);

    // Fill in multiple form fields
    await user.type(locationInput, 'San Francisco');
    await user.type(startDateInput, '2024-03-15');
    await user.type(endDateInput, '2024-03-17');
    await user.type(kidsAgesInput, '5, 8');
    await user.type(preferencesInput, 'outdoor activities');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(preferencesInput).toHaveValue('outdoor activities');
    });

    // Verify fields have values before reset
    expect(locationInput).toHaveValue('San Francisco');
    expect(startDateInput).toHaveValue('2024-03-15');

    // Click the reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    // Wait for state updates and verify all fields are cleared
    await waitFor(() => {
      expect(locationInput).toHaveValue('');
      expect(startDateInput).toHaveValue('');
      expect(endDateInput).toHaveValue('');
      expect(kidsAgesInput).toHaveValue('');
      expect(preferencesInput).toHaveValue('');
    });

    // Verify onReset callback was called
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  // ============================================================================
  // Test Case 9: Kids Ages Accepts "3, 7, 12" Format with Spaces
  // ============================================================================

  /**
   * Test Case 9: Kids ages accepts "3, 7, 12" format with spaces
   * 
   * Verifies that the kids ages field accepts comma-separated integers
   * with spaces between them. This is the expected user-friendly format
   * documented in the UI.
   * 
   * The form should:
   * 1. Accept "3, 7, 12" as valid input
   * 2. Pass the value to onSubmit unchanged
   * 3. Not show any validation errors
   */
  it('Kids ages accepts "3, 7, 12" format with spaces', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const locationInput = screen.getByLabelText(/location/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in all required fields plus kids ages with spaces
    await user.type(locationInput, 'San Francisco');
    await user.type(startDateInput, '2024-03-15');
    await user.type(endDateInput, '2024-03-17');
    await user.type(kidsAgesInput, '3, 7, 12');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('3, 7, 12');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Wait for the submission and verify the kids ages value is passed correctly
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kidsAges: '3, 7, 12'
        })
      );
    });

    // Verify no validation error is shown for kids ages
    const kidsAgesError = screen.queryByText(/enter ages as numbers separated by commas/i);
    expect(kidsAgesError).not.toBeInTheDocument();
  });

  // ============================================================================
  // Additional Edge Case Tests for Robustness
  // ============================================================================

  /**
   * Additional Test: Verifies form handles blur events correctly
   * 
   * Tests that fireEvent.blur can be used to trigger field validation
   * without full form submission (for accessibility and UX testing).
   */
  it('handles field blur events correctly for validation feedback', async () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get the location input
    const locationInput = screen.getByLabelText(/location/i);

    // Use fireEvent to simulate blur after focusing without entering value
    fireEvent.focus(locationInput);
    fireEvent.blur(locationInput);

    // Form should still work - button remains disabled for empty required field
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeDisabled();
  });

  /**
   * Additional Test: Verifies form change events update state correctly
   * 
   * Tests that fireEvent.change can be used to update form values
   * as an alternative to userEvent.type.
   */
  it('handles direct change events on form fields', async () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get form elements
    const locationInput = screen.getByLabelText(/location/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    // Use fireEvent.change to update field values
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    fireEvent.change(startDateInput, { target: { value: '2024-04-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-04-03' } });

    // Verify values are updated
    expect(locationInput).toHaveValue('New York');
    expect(startDateInput).toHaveValue('2024-04-01');
    expect(endDateInput).toHaveValue('2024-04-03');

    // Button should now be enabled
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeEnabled();
  });
});
