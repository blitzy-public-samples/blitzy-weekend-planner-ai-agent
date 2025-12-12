/**
 * InputForm component handles user input for weekend planning.
 * Includes location, dates, kids ages, and preferences fields.
 */

import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import type { GeneratePlanInput } from '../types';

/**
 * Props for the InputForm component
 */
export interface InputFormProps {
  /** Callback function when form is submitted with valid data */
  onSubmit: (input: GeneratePlanInput) => void;
  /** Callback function when form is reset */
  onReset?: () => void;
  /** Whether the form is in a loading/submitting state */
  isLoading?: boolean;
}

/**
 * Form validation errors interface
 */
interface FormErrors {
  location?: string;
  startDate?: string;
  endDate?: string;
  kidsAges?: string;
}

/**
 * Input form component for weekend planning.
 * Provides form fields for location, date range, kids ages, and preferences
 * with inline validation and accessible error messages.
 */
export function InputForm({ onSubmit, onReset, isLoading = false }: InputFormProps) {
  // Form state
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kidsAges, setKidsAges] = useState('');
  const [preferences, setPreferences] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validates the form and returns errors
   */
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be on or after start date';
    }

    // Validate kids ages format if provided
    if (kidsAges.trim()) {
      const ages = kidsAges.split(',').map(age => age.trim());
      const invalidAges = ages.some(age => {
        const num = parseInt(age, 10);
        return isNaN(num) || num < 0 || num > 18;
      });
      if (invalidAges) {
        newErrors.kidsAges = 'Enter ages as numbers separated by commas (0-18)';
      }
    }

    return newErrors;
  }, [location, startDate, endDate, kidsAges]);

  /**
   * Checks if the form has all required fields filled
   */
  const isFormValid = useCallback((): boolean => {
    return location.trim() !== '' && startDate !== '' && endDate !== '';
  }, [location, startDate, endDate]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({
        location: location.trim(),
        startDate,
        endDate,
        kidsAges: kidsAges.trim() || undefined,
        preferences: preferences.trim() || undefined
      });
    }
  }, [location, startDate, endDate, kidsAges, preferences, validateForm, onSubmit]);

  /**
   * Handles form reset
   */
  const handleReset = useCallback(() => {
    setLocation('');
    setStartDate('');
    setEndDate('');
    setKidsAges('');
    setPreferences('');
    setErrors({});
    onReset?.();
  }, [onReset]);

  /**
   * Handles input change with error clearing
   */
  const handleChange = useCallback(
    (field: keyof FormErrors, setter: (value: string) => void) => 
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setter(e.target.value);
        if (errors[field]) {
          setErrors(prev => ({ ...prev, [field]: undefined }));
        }
      },
    [errors]
  );

  const canSubmit = isFormValid() && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Location field */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-text mb-1">
          Location <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={handleChange('location', setLocation)}
          placeholder="Enter city or zip code"
          className={`w-full px-4 py-2 rounded-xl border ${
            errors.location ? 'border-error' : 'border-text/20'
          } bg-white focus:outline-none focus:ring-2 focus:ring-primary`}
          aria-invalid={!!errors.location}
          aria-describedby={errors.location ? 'location-error' : undefined}
          disabled={isLoading}
        />
        {errors.location && (
          <p id="location-error" className="mt-1 text-sm text-error" role="alert">
            {errors.location}
          </p>
        )}
      </div>

      {/* Date fields row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-text mb-1">
            Start Date <span className="text-error">*</span>
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={handleChange('startDate', setStartDate)}
            className={`w-full px-4 py-2 rounded-xl border ${
              errors.startDate ? 'border-error' : 'border-text/20'
            } bg-white focus:outline-none focus:ring-2 focus:ring-primary`}
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'startDate-error' : undefined}
            disabled={isLoading}
          />
          {errors.startDate && (
            <p id="startDate-error" className="mt-1 text-sm text-error" role="alert">
              {errors.startDate}
            </p>
          )}
        </div>

        {/* End date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-text mb-1">
            End Date <span className="text-error">*</span>
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={handleChange('endDate', setEndDate)}
            className={`w-full px-4 py-2 rounded-xl border ${
              errors.endDate ? 'border-error' : 'border-text/20'
            } bg-white focus:outline-none focus:ring-2 focus:ring-primary`}
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? 'endDate-error' : undefined}
            disabled={isLoading}
          />
          {errors.endDate && (
            <p id="endDate-error" className="mt-1 text-sm text-error" role="alert">
              {errors.endDate}
            </p>
          )}
        </div>
      </div>

      {/* Kids ages field */}
      <div>
        <label htmlFor="kidsAges" className="block text-sm font-medium text-text mb-1">
          Kids Ages <span className="text-text/60">(optional)</span>
        </label>
        <input
          type="text"
          id="kidsAges"
          value={kidsAges}
          onChange={handleChange('kidsAges', setKidsAges)}
          placeholder="e.g., 3, 7, 12"
          className={`w-full px-4 py-2 rounded-xl border ${
            errors.kidsAges ? 'border-error' : 'border-text/20'
          } bg-white focus:outline-none focus:ring-2 focus:ring-primary`}
          aria-invalid={!!errors.kidsAges}
          aria-describedby={errors.kidsAges ? 'kidsAges-error' : undefined}
          disabled={isLoading}
        />
        {errors.kidsAges && (
          <p id="kidsAges-error" className="mt-1 text-sm text-error" role="alert">
            {errors.kidsAges}
          </p>
        )}
      </div>

      {/* Preferences field */}
      <div>
        <label htmlFor="preferences" className="block text-sm font-medium text-text mb-1">
          Preferences <span className="text-text/60">(optional)</span>
        </label>
        <textarea
          id="preferences"
          value={preferences}
          onChange={handleChange('preferences' as keyof FormErrors, setPreferences)}
          placeholder="e.g., outdoor activities, avoid crowds, budget-friendly"
          rows={3}
          className="w-full px-4 py-2 rounded-xl border border-text/20 bg-white 
                     focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          disabled={isLoading}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors
                     ${canSubmit 
                       ? 'bg-primary text-white hover:bg-primary/90' 
                       : 'bg-text/20 text-text/50 cursor-not-allowed'}
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
        >
          {isLoading ? 'Generating...' : 'Generate Plan'}
        </button>
        
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-3 rounded-xl font-medium border border-text/20 text-text
                     hover:bg-text/5 focus:outline-none focus:ring-2 focus:ring-primary 
                     focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

export default InputForm;
