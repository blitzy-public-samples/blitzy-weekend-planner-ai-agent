/**
 * InputForm Component Unit Tests
 * 
 * Comprehensive test suite for the InputForm component validating:
 * - Form field rendering (Zip Code and Kids Ages only)
 * - Form validation logic (required Zip Code, optional kids ages with 0 < age < 120)
 * - Submit and reset functionality
 * - Age input format acceptance with whitespace handling
 * 
 * Uses Vitest as the test runner with React Testing Library for component testing
 * and userEvent for realistic user interaction simulation.
 * 
 * @module __tests__/components/InputForm.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import InputForm from '../../components/InputForm';

/**
 * InputForm Component Test Suite
 * 
 * Tests all aspects of the InputForm component including:
 * - Zip Code field (required)
 * - Kids Ages field (optional, comma-separated integers 0 < age < 120)
 * - Button state management (enabled/disabled)
 * - Validation error display
 * - Form submission with correct data structure
 * - Form reset functionality
 * - Age parsing with whitespace handling
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
   * Test Case 1: Renders Zip Code field as required
   * 
   * Verifies that the Zip Code input field is present in the DOM
   * with proper label for accessibility compliance.
   */
  it('renders Zip Code field as required', () => {
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Assert that Zip Code input is present and accessible by label
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    expect(zipCodeInput).toBeInTheDocument();
    expect(zipCodeInput).toHaveAttribute('type', 'text');
    expect(zipCodeInput).toHaveAttribute('aria-required', 'true');
  });

  // ============================================================================
  // Test Case 2: Optional Field Rendering
  // ============================================================================

  /**
   * Test Case 2: Renders optional Kids Ages field
   * 
   * Verifies that the Kids Ages optional field is present in the DOM.
   * This field is not required for form submission.
   */
  it('renders optional Kids Ages field', () => {
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Assert that Kids Ages input is present
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
    expect(kidsAgesInput).toBeInTheDocument();
    expect(kidsAgesInput).toHaveAttribute('type', 'text');
    
    // Should show "(optional)" indicator
    expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();
  });

  // ============================================================================
  // Test Case 3: Only Two Fields Rendered
  // ============================================================================

  /**
   * Test Case 3: Form contains only Zip Code and Kids Ages fields
   * 
   * Verifies that removed fields (Start Date, End Date, Preferences)
   * are NOT rendered in the form.
   */
  it('does NOT render Start Date, End Date, or Preferences fields', () => {
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Assert that old fields are NOT present
    expect(screen.queryByLabelText(/start date/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/end date/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/preferences/i)).not.toBeInTheDocument();
    
    // Should not have any date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(0);
    
    // Should not have any textareas
    const textareas = document.querySelectorAll('textarea');
    expect(textareas.length).toBe(0);
  });

  // ============================================================================
  // Test Case 4: Generate Button Disabled When Zip Code Empty
  // ============================================================================

  /**
   * Test Case 4: Generate button disabled when Zip Code empty
   * 
   * Verifies that the Generate Plan button is disabled when the
   * required Zip Code field is empty. This prevents form submission
   * without required data.
   */
  it('Generate button disabled when Zip Code empty', () => {
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Find the submit button by its accessible name
    const submitButton = screen.getByRole('button', { name: /generate plan/i });

    // Assert that button is disabled when Zip Code is empty
    expect(submitButton).toBeDisabled();

    // Verify that aria-disabled attribute is also set for accessibility
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
  });

  // ============================================================================
  // Test Case 5: Generate Button Enabled When Zip Code Filled
  // ============================================================================

  /**
   * Test Case 5: Generate button enabled when Zip Code filled
   * 
   * Verifies that the Generate Plan button becomes enabled when the
   * required Zip Code field is filled (Kids Ages is optional).
   */
  it('Generate button enabled when Zip Code filled', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get reference to Zip Code input
    const zipCodeInput = screen.getByLabelText(/zip code/i);

    // Fill in Zip Code
    await user.type(zipCodeInput, '94105');

    // Wait for input state update
    await waitFor(() => {
      expect(zipCodeInput).toHaveValue('94105');
    });

    // Verify button is now enabled
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveAttribute('aria-disabled', 'false');
  });

  // ============================================================================
  // Test Case 6: Calls onSubmit with Correct Data Structure
  // ============================================================================

  /**
   * Test Case 6: Calls onSubmit with correct GeneratePlanInput structure
   * 
   * Verifies that when the form is submitted with valid data, the onSubmit
   * callback is called with a properly structured GeneratePlanInput object.
   * 
   * Expected structure:
   * {
   *   location: string,      // Zip Code value
   *   kidsAges: number[]     // Parsed array of ages
   * }
   */
  it('calls onSubmit with correct GeneratePlanInput structure', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);

    // Fill in form fields
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5, 8, 12');

    // Wait for all input state updates
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('5, 8, 12');
    });

    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify correct data structure
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        location: '94105',
        kidsAges: [5, 8, 12]
      });
    });
  });

  // ============================================================================
  // Test Case 7: Submits with Empty Kids Ages as Empty Array
  // ============================================================================

  /**
   * Test Case 7: Submits with empty Kids Ages as empty array
   * 
   * Verifies that when Kids Ages is left empty (optional field),
   * the form submits with an empty array for kidsAges.
   */
  it('submits with empty Kids Ages as empty array', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get Zip Code input and fill it
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    await user.type(zipCodeInput, '02138');

    // Wait for input state update
    await waitFor(() => {
      expect(zipCodeInput).toHaveValue('02138');
    });

    // Click submit without filling Kids Ages
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify empty array for kidsAges
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        location: '02138',
        kidsAges: []
      });
    });
  });

  // ============================================================================
  // Test Case 8: Age Parsing with Whitespace
  // ============================================================================

  /**
   * Test Case 8: Accepts ages with spaces around commas
   * 
   * Verifies that the age parsing handles various whitespace patterns:
   * "5, 8,12" and "5,  8, 12" should all parse to [5, 8, 12]
   */
  it('parses ages with spaces correctly', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get form inputs
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);

    // Fill in with varied spacing
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5,  8, 12 ');  // Various spacing

    // Submit form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify ages parsed correctly despite whitespace
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        location: '94105',
        kidsAges: [5, 8, 12]
      });
    });
  });

  // ============================================================================
  // Test Case 9: Shows Error for Invalid Age Values
  // ============================================================================

  /**
   * Test Case 9: Shows error for invalid age values
   * 
   * Verifies that form validation catches invalid age values:
   * - Ages must be integers
   * - Ages must be > 0 and < 120
   */
  it('shows error for invalid age values', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get form inputs
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);

    // Fill in Zip Code and invalid ages
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5, 150, 8');  // 150 is out of range

    // Submit form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify error message appears
    await waitFor(() => {
      const errorMessage = screen.getByText(/enter valid ages/i);
      expect(errorMessage).toBeInTheDocument();
    });

    // Verify aria-invalid is set
    expect(kidsAgesInput).toHaveAttribute('aria-invalid', 'true');

    // Verify onSubmit was NOT called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Test Case 10: Reset Button Clears All Fields
  // ============================================================================

  /**
   * Test Case 10: Reset button clears all field values
   * 
   * Verifies that clicking the Reset button:
   * 1. Clears all form field values
   * 2. Calls the onReset callback
   */
  it('Reset button clears all field values', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get form inputs
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);

    // Fill in form fields
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5, 8');

    // Verify fields have values
    await waitFor(() => {
      expect(zipCodeInput).toHaveValue('94105');
      expect(kidsAgesInput).toHaveValue('5, 8');
    });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    // Verify all fields are cleared
    await waitFor(() => {
      expect(zipCodeInput).toHaveValue('');
      expect(kidsAgesInput).toHaveValue('');
    });

    // Verify onReset callback was called
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  // ============================================================================
  // Test Case 11: Loading State Disables Form
  // ============================================================================

  /**
   * Test Case 11: Loading state disables all inputs and buttons
   * 
   * Verifies that when isLoading is true, all form inputs and the
   * submit button are disabled to prevent duplicate submissions.
   */
  it('disables form when isLoading is true', () => {
    render(
      <InputForm 
        onSubmit={mockOnSubmit} 
        onReset={mockOnReset} 
        isLoading={true}
      />
    );

    // Verify inputs are disabled
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids.*ages/i);
    expect(zipCodeInput).toBeDisabled();
    expect(kidsAgesInput).toBeDisabled();

    // Verify submit button shows loading text
    const submitButton = screen.getByRole('button', { name: /generating/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
