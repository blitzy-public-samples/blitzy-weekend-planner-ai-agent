/**
 * InputForm Component
 * 
 * React functional component implementing the user input form for Weekend Planner.
 * Contains controlled inputs for:
 * - Zip Code (required) - user's location for the weekend plan
 * - Kids Ages (optional) - comma-separated integers with ages 0 < age < 120
 * 
 * Features:
 * - Form validation with inline error messages
 * - Generate Plan button disabled until required Zip Code is valid
 * - Reset button to clear all fields
 * - Tailwind CSS styling with primary color #1e3a5f for CTAs (WCAG AA compliant)
 * - Proper ARIA attributes for accessibility (WCAG AA compliance)
 * 
 * @module components/InputForm
 */

import React, { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import type { GeneratePlanInput } from '../types';

/**
 * Props interface for the InputForm component.
 * Defines the callback functions and loading state management.
 */
export interface InputFormProps {
  /**
   * Callback function invoked when form is submitted with valid data.
   * Receives the validated form data as a GeneratePlanInput object.
   */
  onSubmit: (input: GeneratePlanInput) => void;

  /**
   * Callback function invoked when the Reset button is clicked.
   * Called after all form fields have been cleared.
   */
  onReset: () => void;

  /**
   * Whether the form is in a loading/submitting state.
   * When true, all inputs and buttons are disabled.
   * @default false
   */
  isLoading?: boolean;
}

/**
 * Internal interface for tracking form validation errors.
 * Each property corresponds to a form field that can have validation errors.
 */
interface FormErrors {
  /** Validation error message for the Zip Code (location) field */
  location?: string;
  /** Validation error message for the kids ages field */
  kidsAges?: string;
}

/**
 * Parses a comma-separated string of kids ages into an array of numbers.
 * Validates that each age is a valid integer where 0 < age < 120.
 * 
 * @param input - The raw string input from the form field
 * @returns Array of parsed ages if valid, empty array if input is empty, null if invalid
 * 
 * @example
 * parseKidsAges("5, 8, 12")  // returns [5, 8, 12]
 * parseKidsAges("")          // returns []
 * parseKidsAges("5, abc, 8") // returns null (invalid)
 * parseKidsAges("0, 5, 120") // returns null (out of range)
 */
function parseKidsAges(input: string): number[] | null {
  if (!input.trim()) return []; // Empty is valid (optional field)
  
  const ages = input.split(',').map(s => s.trim());
  const result: number[] = [];
  
  for (const age of ages) {
    const num = parseInt(age, 10);
    if (isNaN(num) || age !== String(num) || num <= 0 || num >= 120) {
      return null; // Invalid
    }
    result.push(num);
  }
  return result;
}

/**
 * InputForm component for weekend planning input.
 * 
 * Provides a fully accessible form with validation for collecting
 * weekend trip planning details from the user.
 * 
 * Form contains exactly two fields:
 * - Zip Code (required): User's location
 * - Kids Ages (optional): Comma-separated ages (0 < age < 120)
 * 
 * @param props - Component props
 * @param props.onSubmit - Callback when form is submitted with valid data
 * @param props.onReset - Callback when form is reset
 * @param props.isLoading - Whether form is in loading state
 * @returns The rendered InputForm component
 * 
 * @example
 * ```tsx
 * <InputForm
 *   onSubmit={(data) => console.log('Form submitted:', data)}
 *   onReset={() => console.log('Form reset')}
 *   isLoading={false}
 * />
 * ```
 */
export function InputForm({ onSubmit, onReset, isLoading = false }: InputFormProps): React.ReactElement {
  // Form field state management using controlled inputs
  const [location, setLocation] = useState<string>('');
  const [kidsAges, setKidsAges] = useState<string>('');
  
  // Validation errors state
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validates all form fields and returns an object containing any validation errors.
   * Checks:
   * - Zip Code (location) is not empty
   * - Kids ages (if provided) are valid comma-separated integers where 0 < age < 120
   * 
   * @returns Object containing validation error messages for invalid fields
   */
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    // Validate Zip Code (required)
    if (!location.trim()) {
      newErrors.location = 'Zip Code is required';
    }

    // Validate kids ages format if provided (optional field)
    if (kidsAges.trim()) {
      const parsedAges = parseKidsAges(kidsAges);
      if (parsedAges === null) {
        newErrors.kidsAges = 'Enter valid ages as numbers separated by commas (1-119)';
      }
    }

    return newErrors;
  }, [location, kidsAges]);

  /**
   * Checks if all required form fields have valid values.
   * Used to determine if the Generate Plan button should be enabled.
   * Only Zip Code is required.
   * 
   * @returns True if the required Zip Code field has a value
   */
  const isFormValid = useCallback((): boolean => {
    return location.trim() !== '';
  }, [location]);

  /**
   * Handles form submission.
   * Validates all fields and calls onSubmit with the form data if valid.
   * 
   * @param e - Form submit event
   */
  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // Run full validation
    const validationErrors = validateForm();
    setErrors(validationErrors);

    // Only submit if there are no validation errors
    if (Object.keys(validationErrors).length === 0) {
      // Parse kids ages into number array (empty array if not provided)
      const parsedAges = parseKidsAges(kidsAges);
      
      const input: GeneratePlanInput = {
        location: location.trim(),
        kidsAges: parsedAges || [], // Use empty array if null (shouldn't happen after validation)
      };
      onSubmit(input);
    }
  }, [location, kidsAges, validateForm, onSubmit]);

  /**
   * Handles form reset.
   * Clears all form fields, resets errors, and calls the onReset callback.
   */
  const handleReset = useCallback((): void => {
    // Clear all form field state
    setLocation('');
    setKidsAges('');
    
    // Clear any validation errors
    setErrors({});
    
    // Notify parent component of reset
    onReset();
  }, [onReset]);

  /**
   * Creates a change handler for a specific form field.
   * When a field is changed, clears any existing error for that field.
   * 
   * @param field - The field name for error tracking
   * @param setter - The state setter function for the field
   * @returns An event handler function for the input
   */
  const createChangeHandler = useCallback(
    (field: keyof FormErrors, setter: (value: string) => void) => 
      (e: ChangeEvent<HTMLInputElement>): void => {
        setter(e.target.value);
        // Clear error for this field when user starts typing
        if (errors[field]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      },
    [errors]
  );

  // Computed value for whether form can be submitted
  const canSubmit = isFormValid() && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow-sm"
      noValidate
    >
      <div className="space-y-6">
        {/* Zip Code field (required) */}
        <div>
          <label
            htmlFor="location"
            className="block text-[#3D405B] font-medium mb-1"
          >
            Zip Code <span className="text-[#E63946]" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={location}
            onChange={createChangeHandler('location', setLocation)}
            placeholder="Enter zip code (e.g., 94105)"
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
              errors.location ? 'border-[#E63946]' : 'border-gray-300'
            }`}
            aria-required="true"
            aria-invalid={errors.location ? 'true' : 'false'}
            aria-describedby={errors.location ? 'location-error' : undefined}
            disabled={isLoading}
          />
          {errors.location && (
            <p
              id="location-error"
              className="text-[#E63946] text-sm mt-1"
              role="alert"
              aria-live="polite"
            >
              {errors.location}
            </p>
          )}
        </div>

        {/* Kids ages field (optional) */}
        <div>
          <label
            htmlFor="kidsAges"
            className="block text-[#3D405B] font-medium mb-1"
          >
            Kids Ages <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="kidsAges"
            name="kidsAges"
            value={kidsAges}
            onChange={createChangeHandler('kidsAges', setKidsAges)}
            placeholder="e.g., 5, 8, 12"
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
              errors.kidsAges ? 'border-[#E63946]' : 'border-gray-300'
            }`}
            aria-invalid={errors.kidsAges ? 'true' : 'false'}
            aria-describedby={errors.kidsAges ? 'kidsAges-error' : 'kidsAges-hint'}
            disabled={isLoading}
          />
          <p id="kidsAges-hint" className="text-gray-500 text-sm mt-1">
            Enter ages separated by commas (valid range: 1-119)
          </p>
          {errors.kidsAges && (
            <p
              id="kidsAges-error"
              className="text-[#E63946] text-sm mt-1"
              role="alert"
              aria-live="polite"
            >
              {errors.kidsAges}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {/* Primary CTA: Generate Plan */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex-1 bg-[#1e3a5f] text-white rounded-xl px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2 ${
              canSubmit
                ? 'hover:bg-[#163045] cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
            aria-disabled={!canSubmit}
          >
            {isLoading ? 'Generating...' : 'Generate Plan'}
          </button>

          {/* Secondary: Reset button */}
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className={`border border-[#3D405B] text-[#3D405B] rounded-xl px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3D405B] focus:ring-offset-2 ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 cursor-pointer'
            }`}
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}

// Default export for the component
export default InputForm;
