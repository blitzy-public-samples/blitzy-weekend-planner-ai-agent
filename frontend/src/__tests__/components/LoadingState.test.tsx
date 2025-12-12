/**
 * Tests for the LoadingState component
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

  it('accepts custom message prop', () => {
    render(<LoadingState message="Custom loading message" />);

    expect(screen.getByText(/custom loading message/i)).toBeInTheDocument();
  });
});
