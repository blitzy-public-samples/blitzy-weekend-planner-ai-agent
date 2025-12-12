/**
 * InputForm Component
 * 
 * React functional component implementing the user input form for Weekend Planner.
 * Contains controlled inputs for:
 * - Location (required) - city name or zip code
 * - Start date (required) - YYYY-MM-DD format
 * - End date (required with >= startDate validation)
 * - Kids ages (optional, comma-separated integers 1-18)
 * - Preferences (optional textarea for activity preferences)
 * 
 * Features:
 * - Form validation with inline error messages
 * - Generate Plan button disabled until required fields valid
 * - Reset button to clear all fields
 * - Tailwind CSS styling with primary color #E07A5F for CTAs
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
  /** Validation error message for the location field */
  location?: string;
  /** Validation error message for the start date field */
  startDate?: string;
  /** Validation error message for the end date field */
  endDate?: string;
  /** Validation error message for the kids ages field */
  kidsAges?: string;
}

/**
 * InputForm component for weekend planning input.
 * 
 * Provides a fully accessible form with validation for collecting
 * weekend trip planning details from the user.
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [kidsAges, setKidsAges] = useState<string>('');
  const [preferences, setPreferences] = useState<string>('');
  
  // Validation errors state
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validates all form fields and returns an object containing any validation errors.
   * Checks:
   * - Location is not empty
   * - Start date is provided
   * - End date is provided and >= start date
   * - Kids ages (if provided) are valid comma-separated integers 1-18
   * 
   * @returns Object containing validation error messages for invalid fields
   */
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    // Validate location (required)
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Validate start date (required)
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    // Validate end date (required)
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    } else if (startDate && endDate) {
      // Check that end date is on or after start date
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be on or after start date';
      }
    }

    // Validate kids ages format if provided (optional field)
    if (kidsAges.trim()) {
      const agesArray = kidsAges.split(',').map(age => age.trim());
      const hasInvalidAge = agesArray.some(age => {
        // Check if it's a valid integer
        const num = parseInt(age, 10);
        // Must be a number between 1 and 18 (inclusive)
        return isNaN(num) || num < 1 || num > 18 || age !== String(num);
      });
      if (hasInvalidAge) {
        newErrors.kidsAges = 'Enter ages as numbers separated by commas';
      }
    }

    return newErrors;
  }, [location, startDate, endDate, kidsAges]);

  /**
   * Checks if all required form fields have valid values.
   * Used to determine if the Generate Plan button should be enabled.
   * Note: This only checks that required fields are filled, not full validation.
   * 
   * @returns True if all required fields have values
   */
  const isFormValid = useCallback((): boolean => {
    const hasLocation = location.trim() !== '';
    const hasStartDate = startDate !== '';
    const hasEndDate = endDate !== '';
    return hasLocation && hasStartDate && hasEndDate;
  }, [location, startDate, endDate]);

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
      const input: GeneratePlanInput = {
        location: location.trim(),
        startDate: startDate,
        endDate: endDate,
        kidsAges: kidsAges.trim() || undefined,
        preferences: preferences.trim() || undefined,
      };
      onSubmit(input);
    }
  }, [location, startDate, endDate, kidsAges, preferences, validateForm, onSubmit]);

  /**
   * Handles form reset.
   * Clears all form fields, resets errors, and calls the onReset callback.
   */
  const handleReset = useCallback((): void => {
    // Clear all form field state
    setLocation('');
    setStartDate('');
    setEndDate('');
    setKidsAges('');
    setPreferences('');
    
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
   * @returns An event handler function for the input/textarea
   */
  const createChangeHandler = useCallback(
    (field: keyof FormErrors | null, setter: (value: string) => void) => 
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        setter(e.target.value);
        // Clear error for this field when user starts typing
        if (field && errors[field]) {
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
        {/* Location field (required) */}
        <div>
          <label
            htmlFor="location"
            className="block text-[#3D405B] font-medium mb-1"
          >
            Location <span className="text-[#E63946]" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={location}
            onChange={createChangeHandler('location', setLocation)}
            placeholder="Enter city or zip code"
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] ${
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

        {/* Date fields row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start date field (required) */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-[#3D405B] font-medium mb-1"
            >
              Start Date <span className="text-[#E63946]" aria-hidden="true">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={createChangeHandler('startDate', setStartDate)}
              className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] ${
                errors.startDate ? 'border-[#E63946]' : 'border-gray-300'
              }`}
              aria-required="true"
              aria-invalid={errors.startDate ? 'true' : 'false'}
              aria-describedby={errors.startDate ? 'startDate-error' : undefined}
              disabled={isLoading}
            />
            {errors.startDate && (
              <p
                id="startDate-error"
                className="text-[#E63946] text-sm mt-1"
                role="alert"
                aria-live="polite"
              >
                {errors.startDate}
              </p>
            )}
          </div>

          {/* End date field (required, must be >= start date) */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-[#3D405B] font-medium mb-1"
            >
              End Date <span className="text-[#E63946]" aria-hidden="true">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={createChangeHandler('endDate', setEndDate)}
              min={startDate}
              className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] ${
                errors.endDate ? 'border-[#E63946]' : 'border-gray-300'
              }`}
              aria-required="true"
              aria-invalid={errors.endDate ? 'true' : 'false'}
              aria-describedby={errors.endDate ? 'endDate-error' : undefined}
              disabled={isLoading}
            />
            {errors.endDate && (
              <p
                id="endDate-error"
                className="text-[#E63946] text-sm mt-1"
                role="alert"
                aria-live="polite"
              >
                {errors.endDate}
              </p>
            )}
          </div>
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
            placeholder="e.g., 3, 7, 12"
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] ${
              errors.kidsAges ? 'border-[#E63946]' : 'border-gray-300'
            }`}
            aria-invalid={errors.kidsAges ? 'true' : 'false'}
            aria-describedby={errors.kidsAges ? 'kidsAges-error' : 'kidsAges-hint'}
            disabled={isLoading}
          />
          <p id="kidsAges-hint" className="text-gray-500 text-sm mt-1">
            Enter ages separated by commas (1-18)
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

        {/* Preferences field (optional) */}
        <div>
          <label
            htmlFor="preferences"
            className="block text-[#3D405B] font-medium mb-1"
          >
            Preferences <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="preferences"
            name="preferences"
            value={preferences}
            onChange={createChangeHandler(null, setPreferences)}
            placeholder="e.g., outdoor activities, avoid crowds"
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] resize-none"
            aria-describedby="preferences-hint"
            disabled={isLoading}
          />
          <p id="preferences-hint" className="text-gray-500 text-sm mt-1">
            Describe your activity preferences or constraints
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {/* Primary CTA: Generate Plan */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex-1 bg-[#E07A5F] text-white rounded-xl px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:ring-offset-2 ${
              canSubmit
                ? 'hover:bg-[#d46a4f] cursor-pointer'
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
