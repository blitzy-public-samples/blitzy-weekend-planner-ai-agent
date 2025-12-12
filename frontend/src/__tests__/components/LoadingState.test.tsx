/**
 * Tests for the LoadingState component
 * 
 * This component is a pure presentational component that displays
 * a skeleton loading animation while the AI is generating a weekend plan.
 * 
 * Test cases (3 total):
 * 1. Renders skeleton/pulse animation elements
 * 2. Displays "Creating your perfect weekend..." message
 * 3. Has aria-busy="true" for accessibility
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../../components/LoadingState';

describe('LoadingState', () => {
  it('renders skeleton/pulse animation elements', () => {
    render(<LoadingState />);

    // Check for elements with animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('displays "Creating your perfect weekend..." message', () => {
    render(<LoadingState />);

    expect(screen.getByText(/creating your perfect weekend/i)).toBeInTheDocument();
  });

  it('has aria-busy="true" for accessibility', () => {
    render(<LoadingState />);

    const loadingContainer = screen.getByLabelText(/loading/i);
    expect(loadingContainer).toHaveAttribute('aria-busy', 'true');
  });
});
