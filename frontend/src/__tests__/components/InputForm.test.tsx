/**
 * InputForm Component Unit Tests
 * 
 * Comprehensive test suite for the InputForm component validating:
 * - Form field rendering (zip code, kids ages)
 * - Form validation logic (required zip code, age range validation 0 < age < 120)
 * - Submit and reset functionality
 * - Input format acceptance with various whitespace patterns
 * 
 * Uses Vitest as the test runner with React Testing Library for component testing
 * and userEvent for realistic user interaction simulation.
 * 
 * Test Coverage: 17 test cases
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
 * - Required field rendering (Zip Code)
 * - Optional field rendering (Kids Ages)
 * - Button state management (enabled/disabled)
 * - Validation error display for age range
 * - Form submission with correct data structure
 * - Form reset functionality
 * - Special input format handling for ages with whitespace
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
   * Test Case 1: Renders zip code field
   * 
   * Verifies that the required zip code input field is present in the DOM
   * with proper label for accessibility compliance.
   * 
   * Fields tested:
   * - Zip Code (text input, required)
   */
  it('renders zip code field', () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Assert that zip code input is present and accessible by label
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    expect(zipCodeInput).toBeInTheDocument();
    expect(zipCodeInput).toHaveAttribute('type', 'text');
  });

  // ============================================================================
  // Test Case 2: Optional Field Rendering
  // ============================================================================

  /**
   * Test Case 2: Renders optional kids ages field
   * 
   * Verifies that the optional kids ages field is present in the DOM.
   * This field is not required for form submission but enhances
   * the weekend planning experience.
   * 
   * Fields tested:
   * - Kids Ages (text input for comma-separated ages)
   */
  it('renders optional kids ages field', () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Assert that kids ages input is present
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);
    expect(kidsAgesInput).toBeInTheDocument();
    expect(kidsAgesInput).toHaveAttribute('type', 'text');
  });

  // ============================================================================
  // Test Case 3: Generate Button Disabled When Zip Code Empty
  // ============================================================================

  /**
   * Test Case 3: Generate button disabled when zip code empty
   * 
   * Verifies that the Generate Plan button is disabled when the
   * required zip code field is empty. This prevents form submission
   * without required data.
   */
  it('Generate button disabled when zip code empty', () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Find the submit button by its accessible name
    const submitButton = screen.getByRole('button', { name: /generate plan/i });

    // Assert that button is disabled when zip code is empty
    expect(submitButton).toBeDisabled();

    // Verify that aria-disabled attribute is also set for accessibility
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
  });

  // ============================================================================
  // Test Case 4: Generate Button Enabled When Required Fields Valid
  // ============================================================================

  /**
   * Test Case 4: Generate button enabled when required fields valid
   * 
   * Verifies that the Generate Plan button becomes enabled when the
   * required zip code field is filled with a valid value.
   */
  it('Generate button enabled when required fields valid', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get reference to zip code input
    const zipCodeInput = screen.getByLabelText(/zip code/i);

    // Fill in the zip code field with valid data
    await user.type(zipCodeInput, '94105');

    // Wait for input state update to complete
    await waitFor(() => {
      expect(zipCodeInput).toHaveValue('94105');
    });

    // Verify button is now enabled
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveAttribute('aria-disabled', 'false');
  });

  // ============================================================================
  // Test Case 5: Calls onSubmit with Correct GeneratePlanInput Structure
  // ============================================================================

  /**
   * Test Case 5: Calls onSubmit with correct GeneratePlanInput structure
   * 
   * Verifies that when the form is submitted with valid data, the onSubmit
   * callback is called with a properly structured GeneratePlanInput object
   * containing all form field values.
   * 
   * Expected structure:
   * {
   *   location: string,  // Zip Code
   *   kidsAges: number[]  // Parsed array of ages
   * }
   */
  it('calls onSubmit with correct GeneratePlanInput structure', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in all form fields
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5, 8');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('5, 8');
    });

    // Click the submit button to trigger form submission
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Wait for the submission callback and verify correct data structure
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        location: '94105',
        kidsAges: [5, 8]  // Now number array instead of string
      });
    });
  });

  // ============================================================================
  // Test Case 6: Reset Button Clears All Field Values
  // ============================================================================

  /**
   * Test Case 6: Reset button clears all field values
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
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in form fields
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5, 8');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('5, 8');
    });

    // Verify fields have values before reset
    expect(zipCodeInput).toHaveValue('94105');

    // Click the reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    // Wait for state updates and verify all fields are cleared
    await waitFor(() => {
      expect(zipCodeInput).toHaveValue('');
      expect(kidsAgesInput).toHaveValue('');
    });

    // Verify onReset callback was called
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  // ============================================================================
  // Test Case 7: Kids Ages Accepts "3, 7, 12" Format with Spaces
  // ============================================================================

  /**
   * Test Case 7: Kids ages accepts "3, 7, 12" format with spaces
   * 
   * Verifies that the kids ages field accepts comma-separated integers
   * with spaces between them. This is the expected user-friendly format
   * documented in the UI.
   * 
   * The form should:
   * 1. Accept "3, 7, 12" as valid input
   * 2. Pass the parsed number array to onSubmit
   * 3. Not show any validation errors
   */
  it('Kids ages accepts "3, 7, 12" format with spaces', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in required field plus kids ages with spaces
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '3, 7, 12');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('3, 7, 12');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Wait for the submission and verify the kids ages value is passed correctly as number array
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kidsAges: [3, 7, 12]  // Now number array instead of string
        })
      );
    });

    // Verify no validation error is shown for kids ages
    const kidsAgesError = screen.queryByText(/enter ages as numbers separated by commas/i);
    expect(kidsAgesError).not.toBeInTheDocument();
  });

  // ============================================================================
  // Test Case 8: Does Not Render Removed Fields (Start Date, End Date, Preferences)
  // ============================================================================

  /**
   * Test Case 8: Does not render Start Date, End Date, or Preferences fields
   * 
   * Verifies that the form only contains the two specified fields (Zip Code and Kids Ages)
   * and that the removed fields (Start Date, End Date, Preferences) are not present.
   */
  it('does not render Start Date, End Date, or Preferences fields', () => {
    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Verify Start Date field is NOT present
    expect(screen.queryByLabelText(/start date/i)).not.toBeInTheDocument();

    // Verify End Date field is NOT present
    expect(screen.queryByLabelText(/end date/i)).not.toBeInTheDocument();

    // Verify Preferences field is NOT present
    expect(screen.queryByLabelText(/preferences/i)).not.toBeInTheDocument();
  });

  // ============================================================================
  // Test Case 9: Age Validation - Rejects Age 0 (Outside 0 < age)
  // ============================================================================

  /**
   * Test Case 9: Rejects age 0 as invalid (outside 0 < age)
   * 
   * Verifies that age 0 fails validation per the constraint 0 < age < 120.
   * Age must be greater than 0.
   */
  it('rejects age 0 as invalid (outside 0 < age)', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in zip code and invalid age
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '0');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('0');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was NOT called due to validation failure
    // OR verify that an error message appears
    await waitFor(() => {
      // Either submission is blocked or error is shown
      const hasErrorMessage = screen.queryByText(/invalid age/i) !== null || 
                              screen.queryByText(/ages must be between/i) !== null ||
                              screen.queryByText(/enter ages as numbers/i) !== null;
      // Check if form submission was blocked (mockOnSubmit not called)
      // or error is displayed
      const wasNotCalledWithInvalidAge = mockOnSubmit.mock.calls.length === 0 ||
        !mockOnSubmit.mock.calls.some((call: unknown[]) => {
          const arg = call[0] as { kidsAges?: number[] };
          return arg?.kidsAges?.includes(0);
        });
      
      // Either validation prevented submission or error is shown
      expect(wasNotCalledWithInvalidAge || hasErrorMessage).toBe(true);
    });
  });

  // ============================================================================
  // Test Case 10: Age Validation - Rejects Age 120 (Outside age < 120)
  // ============================================================================

  /**
   * Test Case 10: Rejects age 120 as invalid (outside age < 120)
   * 
   * Verifies that age 120 fails validation per the constraint 0 < age < 120.
   * Age must be less than 120.
   */
  it('rejects age 120 as invalid (outside age < 120)', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in zip code and invalid age (boundary)
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '120');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('120');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was NOT called with invalid age
    await waitFor(() => {
      // Either validation prevented submission or error is shown
      const hasErrorMessage = screen.queryByText(/invalid age/i) !== null || 
                              screen.queryByText(/ages must be between/i) !== null ||
                              screen.queryByText(/enter ages as numbers/i) !== null;
      const wasNotCalledWithInvalidAge = mockOnSubmit.mock.calls.length === 0 ||
        !mockOnSubmit.mock.calls.some((call: unknown[]) => {
          const arg = call[0] as { kidsAges?: number[] };
          return arg?.kidsAges?.includes(120);
        });
      
      // Either validation prevented submission or error is shown
      expect(wasNotCalledWithInvalidAge || hasErrorMessage).toBe(true);
    });
  });

  // ============================================================================
  // Test Case 11: Age Validation - Accepts Age 1 (Boundary)
  // ============================================================================

  /**
   * Test Case 11: Accepts age 1 as valid (boundary)
   * 
   * Verifies that age 1 passes validation per the constraint 0 < age < 120.
   * Age 1 is the minimum valid age.
   */
  it('accepts age 1 as valid (boundary)', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in zip code and valid boundary age
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '1');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('1');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was called with valid age
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kidsAges: [1]
        })
      );
    });
  });

  // ============================================================================
  // Test Case 12: Age Validation - Accepts Age 119 (Boundary)
  // ============================================================================

  /**
   * Test Case 12: Accepts age 119 as valid (boundary)
   * 
   * Verifies that age 119 passes validation per the constraint 0 < age < 120.
   * Age 119 is the maximum valid age.
   */
  it('accepts age 119 as valid (boundary)', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in zip code and valid boundary age
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '119');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('119');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was called with valid age
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kidsAges: [119]
        })
      );
    });
  });

  // ============================================================================
  // Test Case 13: Age Input Without Spaces "5,8,12"
  // ============================================================================

  /**
   * Test Case 13: Accepts age input without spaces: "5,8,12"
   * 
   * Verifies that comma-separated ages without spaces are properly parsed.
   */
  it('accepts age input without spaces: "5,8,12"', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in zip code and ages without spaces
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5,8,12');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('5,8,12');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was called with parsed ages
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kidsAges: [5, 8, 12]
        })
      );
    });
  });

  // ============================================================================
  // Test Case 14: Age Input With Spaces After Comma "5, 8, 12"
  // ============================================================================

  /**
   * Test Case 14: Accepts age input with spaces after comma: "5, 8, 12"
   * 
   * Verifies that comma-separated ages with spaces after commas are properly parsed.
   */
  it('accepts age input with spaces after comma: "5, 8, 12"', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in zip code and ages with spaces after commas
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5, 8, 12');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('5, 8, 12');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was called with parsed ages
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kidsAges: [5, 8, 12]
        })
      );
    });
  });

  // ============================================================================
  // Test Case 15: Age Input With Spaces Around Comma "5 , 8 , 12"
  // ============================================================================

  /**
   * Test Case 15: Accepts age input with spaces around comma: "5 , 8 , 12"
   * 
   * Verifies that comma-separated ages with spaces around commas are properly parsed.
   */
  it('accepts age input with spaces around comma: "5 , 8 , 12"', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get references to form elements
    const zipCodeInput = screen.getByLabelText(/zip code/i);
    const kidsAgesInput = screen.getByLabelText(/kids ages/i);

    // Fill in zip code and ages with spaces around commas
    await user.type(zipCodeInput, '94105');
    await user.type(kidsAgesInput, '5 , 8 , 12');

    // Wait for all input state updates to complete
    await waitFor(() => {
      expect(kidsAgesInput).toHaveValue('5 , 8 , 12');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was called with parsed ages
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kidsAges: [5, 8, 12]
        })
      );
    });
  });

  // ============================================================================
  // Test Case 16: Empty Kids Ages Field is Valid (Optional Field)
  // ============================================================================

  /**
   * Test Case 16: Empty kids ages field is valid (optional field)
   * 
   * Verifies that submitting the form with only zip code (no kids ages)
   * is valid since kids ages is an optional field.
   */
  it('allows form submission with only zip code (kids ages optional)', async () => {
    // Setup userEvent for realistic user interaction simulation
    const user = userEvent.setup();

    // Render the InputForm component with mock callbacks
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Get reference to zip code input only
    const zipCodeInput = screen.getByLabelText(/zip code/i);

    // Fill in only the required zip code field
    await user.type(zipCodeInput, '94105');

    // Wait for input state update to complete
    await waitFor(() => {
      expect(zipCodeInput).toHaveValue('94105');
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    // Verify that onSubmit was called with empty kids ages array
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          location: '94105',
          kidsAges: []
        })
      );
    });
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

    // Get the zip code input
    const zipCodeInput = screen.getByLabelText(/zip code/i);

    // Use fireEvent to simulate blur after focusing without entering value
    fireEvent.focus(zipCodeInput);
    fireEvent.blur(zipCodeInput);

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
    const zipCodeInput = screen.getByLabelText(/zip code/i);

    // Use fireEvent.change to update field values
    fireEvent.change(zipCodeInput, { target: { value: '10001' } });

    // Verify values are updated
    expect(zipCodeInput).toHaveValue('10001');

    // Button should now be enabled
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeEnabled();
  });

  // ============================================================================
  // Mutation Testing — parseKidsAges Boundary Mutant Killers
  // ============================================================================

  /**
   * Mutation-testing targeted tests for parseKidsAges() boundary conditions.
   *
   * Each test targets a specific Stryker mutant category with exact assertions
   * that would fail if the corresponding mutation were applied to the source code.
   *
   * Key mutation targets in parseKidsAges() (InputForm.tsx line 80):
   *   - num <= 0  → may mutate to num < 0 (accepts 0) or num >= 0 (rejects all)
   *   - num >= 120 → may mutate to num > 120 (accepts 120) or num <= 120 (rejects all)
   *   - age !== String(num) → may mutate to age === String(num) (inverts validation)
   *   - isNaN(num) → removal mutant
   *   - || operators → may mutate to &&
   */
  describe('Mutation testing - parseKidsAges boundary mutant killers', () => {

    // ------------------------------------------------------------------
    // Phase 1: Comparison-Operator Mutants
    // ------------------------------------------------------------------

    /**
     * Targets `num <= 0` being mutated to `num < 0` which would wrongly accept age 0.
     * Verifies age=0 is rejected and the exact validation error message is displayed.
     */
    it('[EqualityOperator L80] age > 0 boundary: age=0 rejected, age=1 accepted', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      const zipCodeInput = screen.getByLabelText(/zip code/i);
      const kidsAgesInput = screen.getByLabelText(/kids ages/i);

      // Fill zip code (required) and ages with boundary value 0
      await user.type(zipCodeInput, '94105');
      await user.type(kidsAgesInput, '0');

      const submitButton = screen.getByRole('button', { name: /generate plan/i });
      await user.click(submitButton);

      // Verify the validation error is shown with exact text
      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      // onSubmit must NOT have been called — age 0 is invalid
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Combined boundary test: age=119 must be accepted (max valid) while
     * age=120 must be rejected. Catches `num >= 120` mutated to `num > 120`.
     */
    it('[EqualityOperator L80] age < 120 boundary: age=119 accepted, age=120 rejected', async () => {
      // ---- Part 1: age=119 accepted ----
      const user1 = userEvent.setup();
      const { unmount } = render(
        <InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />
      );

      await user1.type(screen.getByLabelText(/zip code/i), '94105');
      await user1.type(screen.getByLabelText(/kids ages/i), '119');

      await user1.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          location: '94105',
          kidsAges: [119],
        });
      });

      // ---- Part 2: age=120 rejected ----
      unmount();
      mockOnSubmit.mockClear();

      const user2 = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user2.type(screen.getByLabelText(/zip code/i), '94105');
      await user2.type(screen.getByLabelText(/kids ages/i), '120');

      await user2.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Specifically targets `num <= 0` mutated to `num < 0`.
     * Age 0 must be rejected because 0 <= 0 is true.
     */
    it('[EqualityOperator L80] exact 0 exclusion - validates num <= 0 comparison', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '0');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Specifically targets `num >= 120` mutated to `num > 120`.
     * Age 120 must be rejected because 120 >= 120 is true.
     */
    it('[EqualityOperator L80] exact 120 exclusion - validates num >= 120 comparison', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '120');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------
    // Phase 2: Exact Return-Value Assertions
    // ------------------------------------------------------------------

    /**
     * Catches arithmetic mutants that alter parsed integer values or the push
     * operation. Uses exact object match (no expect.objectContaining).
     */
    it('[ArithmeticOperator L80] submission with "5, 8" produces exactly [5, 8]', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '5, 8');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        // Exact match — no expect.objectContaining wrapper
        expect(mockOnSubmit).toHaveBeenCalledWith({
          location: '94105',
          kidsAges: [5, 8],
        });
      });
    });

    /**
     * Single-element array verification to catch mutants that break
     * the initial push or return logic for single-age inputs.
     */
    it('[ArithmeticOperator L80] submission with single age "7" produces exactly [7]', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '7');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          location: '94105',
          kidsAges: [7],
        });
      });
    });

    /**
     * Multi-element array with order verification. Catches mutants that
     * modify iteration order or array construction.
     */
    it('[ArithmeticOperator L80] submission with "1,2,3" produces exactly [1, 2, 3]', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '1,2,3');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          location: '94105',
          kidsAges: [1, 2, 3],
        });
      });
    });

    // ------------------------------------------------------------------
    // Phase 3: Empty-String-After-Trim Mutants
    // ------------------------------------------------------------------

    /**
     * Targets removal of the `!input.trim()` guard on line 73 of parseKidsAges.
     * Whitespace-only input must be treated as empty → [] (optional field).
     */
    it('[ConditionalExpression L73] whitespace-only ages input treated as empty', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '   ');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      // Whitespace-only is treated as empty → kidsAges: []
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          location: '94105',
          kidsAges: [],
        });
      });
    });

    /**
     * Comma-separated input with empty segment "5,,8" — the empty segment
     * between commas becomes "" after trim, parseInt returns NaN.
     * Catches StringLiteral mutants on the comma separator.
     */
    it('[StringLiteral L75] comma-separated with empty segments rejects: "5,,8"', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '5,,8');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------
    // Phase 4: Non-Numeric / Edge-Case Input
    // ------------------------------------------------------------------

    /**
     * Non-numeric input "abc" — parseInt returns NaN, so isNaN(num) is true.
     * Catches removal of the isNaN(num) check.
     */
    it('[ConditionalExpression L80] non-numeric input "abc" is rejected', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), 'abc');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Decimal input "1.5" — parseInt("1.5", 10) returns 1 but
     * "1.5" !== String(1) ("1.5" !== "1") → returns null.
     * Catches `age !== String(num)` being mutated to `===`.
     */
    it('[ConditionalExpression L80] decimal input "1.5" is rejected', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '1.5');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Negative number "-5" — parseInt returns -5, and -5 <= 0 triggers rejection.
     * Catches boundary-comparison mutants on the negative side.
     */
    it('[EqualityOperator L80] negative number "-5" is rejected', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '-5');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Mixed valid/invalid "5, abc, 8" — one invalid age invalidates the entire
     * input (parseKidsAges returns null on first invalid element).
     * Catches logical-operator mutants (|| → &&).
     */
    it('[ConditionalExpression L80] mixed valid/invalid "5, abc, 8" is rejected entirely', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '5, abc, 8');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Enter ages as numbers separated by commas (1-119)')
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------
    // Phase 5: Validation Error Message Exact Text
    // ------------------------------------------------------------------

    /**
     * Verifies the exact validation error message text to catch StringLiteral
     * mutants that alter the message string. Uses both getByText (exact match)
     * and role="alert" attribute verification.
     */
    it('[StringLiteral L137] validation error shows exact message text', async () => {
      const user = userEvent.setup();
      render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

      await user.type(screen.getByLabelText(/zip code/i), '94105');
      await user.type(screen.getByLabelText(/kids ages/i), '0');

      await user.click(
        screen.getByRole('button', { name: /generate plan/i })
      );

      // Verify exact error message text via role="alert" element
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveTextContent(
          'Enter ages as numbers separated by commas (1-119)'
        );
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
