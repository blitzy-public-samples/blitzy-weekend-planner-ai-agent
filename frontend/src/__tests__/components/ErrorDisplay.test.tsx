/**
 * Tests for the ErrorDisplay component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import type { ApiError } from '../../types';

describe('ErrorDisplay', () => {
  const mockError: ApiError = {
    message: "Couldn't reach the backend. Make sure the ADK server is running.",
    statusCode: 500,
    rawBody: '{"error": "Internal server error"}'
  };

  it('displays user-friendly error message', () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText(/couldn't reach the backend/i)).toBeInTheDocument();
  });

  it('shows expandable "Technical Details" section', () => {
    render(<ErrorDisplay error={mockError} />);

    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    expect(detailsButton).toBeInTheDocument();
    expect(detailsButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders status code in technical details', () => {
    render(<ErrorDisplay error={mockError} />);

    // Expand the details section
    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(detailsButton);

    expect(screen.getByText(/status code:/i)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('shows raw body content when expanded', () => {
    render(<ErrorDisplay error={mockError} />);

    // Expand the details section
    const detailsButton = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(detailsButton);

    expect(screen.getByText(/response body:/i)).toBeInTheDocument();
    expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
  });

  it('calls onRetry when Try Again button is clicked', () => {
    const mockOnRetry = vi.fn();
    render(<ErrorDisplay error={mockError} onRetry={mockOnRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});
