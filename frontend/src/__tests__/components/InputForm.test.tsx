/**
 * Tests for the InputForm component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputForm } from '../../components/InputForm';

describe('InputForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnReset.mockClear();
  });

  it('renders location, start date, end date fields', () => {
    render(<InputForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('renders optional kids ages and preferences fields', () => {
    render(<InputForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/kids ages/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferences/i)).toBeInTheDocument();
  });

  it('Generate button disabled when location empty', () => {
    render(<InputForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeDisabled();
  });

  it('Generate button disabled when dates missing', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} />);

    const locationInput = screen.getByLabelText(/location/i);
    await user.type(locationInput, 'San Francisco');

    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows inline error when end date < start date', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} />);

    const locationInput = screen.getByLabelText(/location/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    await user.type(locationInput, 'San Francisco');
    await user.type(startDateInput, '2024-03-20');
    await user.type(endDateInput, '2024-03-15');

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    expect(screen.getByText(/end date must be on or after start date/i)).toBeInTheDocument();
  });

  it('Generate button enabled when required fields valid', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/location/i), 'San Francisco');
    await user.type(screen.getByLabelText(/start date/i), '2024-03-15');
    await user.type(screen.getByLabelText(/end date/i), '2024-03-17');

    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    expect(submitButton).toBeEnabled();
  });

  it('calls onSubmit with correct GeneratePlanInput structure', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/location/i), 'San Francisco');
    await user.type(screen.getByLabelText(/start date/i), '2024-03-15');
    await user.type(screen.getByLabelText(/end date/i), '2024-03-17');
    await user.type(screen.getByLabelText(/kids ages/i), '5, 8');
    await user.type(screen.getByLabelText(/preferences/i), 'outdoor activities');

    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      location: 'San Francisco',
      startDate: '2024-03-15',
      endDate: '2024-03-17',
      kidsAges: '5, 8',
      preferences: 'outdoor activities'
    });
  });

  it('Reset button clears all field values', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} onReset={mockOnReset} />);

    // Fill in form
    await user.type(screen.getByLabelText(/location/i), 'San Francisco');
    await user.type(screen.getByLabelText(/start date/i), '2024-03-15');

    // Click reset
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(screen.getByLabelText(/location/i)).toHaveValue('');
    expect(screen.getByLabelText(/start date/i)).toHaveValue('');
    expect(mockOnReset).toHaveBeenCalled();
  });

  it('Kids ages accepts "3, 7, 12" format with spaces', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/location/i), 'San Francisco');
    await user.type(screen.getByLabelText(/start date/i), '2024-03-15');
    await user.type(screen.getByLabelText(/end date/i), '2024-03-17');
    await user.type(screen.getByLabelText(/kids ages/i), '3, 7, 12');

    const submitButton = screen.getByRole('button', { name: /generate plan/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kidsAges: '3, 7, 12'
      })
    );
  });
});
