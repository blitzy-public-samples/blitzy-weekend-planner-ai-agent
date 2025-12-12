/**
 * Tests for the PlanView component
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanView } from '../../components/PlanView';
import type { GeneratePlanResult } from '../../types';

describe('PlanView', () => {
  const mockResult: GeneratePlanResult = {
    success: true,
    planText: `Here's your weekend plan!

## Saturday
- Morning: Visit the local farmer's market
- Afternoon: Hike at the nearby state park

## Sunday
- Morning: Brunch at a local cafe
- Afternoon: Visit the children's museum`,
    rawResponse: [
      {
        id: 'event-1',
        timestamp: new Date().toISOString(),
        author: 'model',
        content: {
          role: 'model',
          parts: [{ text: 'test response' }]
        }
      }
    ]
  };

  it('renders plan text content from planText prop', () => {
    render(<PlanView result={mockResult} />);

    // Use role to get the specific heading, not all matching text
    expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
    expect(screen.getByText(/## saturday/i)).toBeInTheDocument();
    expect(screen.getByText(/## sunday/i)).toBeInTheDocument();
  });

  it('displays structured activity information', () => {
    render(<PlanView result={mockResult} />);

    expect(screen.getByText(/farmer's market/i)).toBeInTheDocument();
    expect(screen.getByText(/children's museum/i)).toBeInTheDocument();
  });

  it('handles unstructured text display gracefully', () => {
    const unstructuredResult: GeneratePlanResult = {
      success: true,
      planText: 'Just a simple text response without any structure.'
    };

    render(<PlanView result={unstructuredResult} />);

    expect(screen.getByText(/simple text response/i)).toBeInTheDocument();
  });

  it('Raw Output section collapsed by default', () => {
    render(<PlanView result={mockResult} />);

    const rawOutputButton = screen.getByRole('button', { name: /raw api response/i });
    expect(rawOutputButton).toBeInTheDocument();
    expect(rawOutputButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('Raw Output expands on toggle click', () => {
    render(<PlanView result={mockResult} />);

    const rawOutputButton = screen.getByRole('button', { name: /raw api response/i });
    fireEvent.click(rawOutputButton);

    expect(rawOutputButton).toHaveAttribute('aria-expanded', 'true');
    // The JSON content should now be visible
    expect(screen.getByText(/event-1/)).toBeInTheDocument();
  });
});
