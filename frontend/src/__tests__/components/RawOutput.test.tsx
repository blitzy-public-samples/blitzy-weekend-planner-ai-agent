/**
 * Tests for the RawOutput component
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RawOutput } from '../../components/RawOutput';
import type { ADKResponse } from '../../types';

describe('RawOutput', () => {
  const mockData: ADKResponse = [
    {
      id: 'event-123',
      timestamp: '2024-03-15T10:00:00Z',
      author: 'model',
      content: {
        role: 'model',
        parts: [{ text: 'Test response content' }]
      }
    }
  ];

  it('renders collapsed by default', () => {
    render(<RawOutput data={mockData} />);

    const toggleButton = screen.getByRole('button', { name: /raw output/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    
    // Content should not be visible
    expect(screen.queryByText(/event-123/)).not.toBeInTheDocument();
  });

  it('expands to show content on click', () => {
    render(<RawOutput data={mockData} />);

    const toggleButton = screen.getByRole('button', { name: /raw output/i });
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/event-123/)).toBeInTheDocument();
  });

  it('displays JSON in preformatted block', () => {
    render(<RawOutput data={mockData} />);

    // Expand the content
    const toggleButton = screen.getByRole('button', { name: /raw output/i });
    fireEvent.click(toggleButton);

    // Check for pre element with JSON content
    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement?.textContent).toContain('event-123');
    expect(preElement?.textContent).toContain('model');
  });

  it('collapses when clicked again', () => {
    render(<RawOutput data={mockData} />);

    const toggleButton = screen.getByRole('button', { name: /raw output/i });
    
    // First click - expand
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/event-123/)).toBeInTheDocument();

    // Second click - collapse
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/event-123/)).not.toBeInTheDocument();
  });
});
