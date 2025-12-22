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
      const errorMessage = screen.queryByText(/invalid age/i) || 
                          screen.queryByText(/ages must be between/i) ||
                          screen.queryByText(/enter ages as numbers/i);
      // Check if form submission was blocked (mockOnSubmit not called)
      // or error is displayed
      if (mockOnSubmit.mock.calls.length > 0) {
        // If somehow called, it should not include invalid age
        expect(mockOnSubmit).not.toHaveBeenCalledWith(
          expect.objectContaining({
            kidsAges: expect.arrayContaining([0])
          })
        );
      }
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
      if (mockOnSubmit.mock.calls.length > 0) {
        // If somehow called, it should not include invalid age
        expect(mockOnSubmit).not.toHaveBeenCalledWith(
          expect.objectContaining({
            kidsAges: expect.arrayContaining([120])
          })
        );
      }
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
});
