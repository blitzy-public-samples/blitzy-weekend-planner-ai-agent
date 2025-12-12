/**
 * RawOutput Component Unit Tests
 * 
 * Comprehensive test suite for the RawOutput component that displays
 * collapsible raw ADK API response data in a preformatted JSON block.
 * 
 * Test Coverage:
 * - Initial collapsed state rendering
 * - Expand functionality on user click
 * - JSON display in preformatted block element
 * - Toggle behavior (collapse on second click)
 * 
 * Testing Strategy:
 * - Uses React Testing Library for DOM queries and assertions
 * - Validates accessibility attributes (aria-expanded, aria-controls)
 * - Tests user interactions via fireEvent.click
 * - Verifies JSON content rendering in <pre> elements
 * 
 * @fileoverview Unit tests for RawOutput collapsible JSON viewer component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RawOutput from '../../components/RawOutput';
import type { ADKResponse } from '../../types';

/**
 * Test suite for the RawOutput component.
 * 
 * The RawOutput component is a collapsible accordion that displays
 * raw ADK response data as formatted JSON. These tests validate
 * the component's core functionality including:
 * 
 * 1. Default collapsed state for cleaner UI
 * 2. Expand on click to reveal JSON content
 * 3. Proper JSON formatting in preformatted block
 * 4. Toggle behavior to collapse when clicked again
 */
describe('RawOutput', () => {
  /**
   * Mock ADK response data for testing.
   * Represents a typical response from the ADK backend with
   * model-generated content including event metadata and text parts.
   */
  const mockData: ADKResponse = [
    {
      id: '1',
      timestamp: '2024-01-01T00:00:00Z',
      author: 'model',
      content: {
        parts: [{ text: 'Sample response' }],
        role: 'model'
      }
    },
    {
      id: '2',
      timestamp: '2024-01-01T00:01:00Z',
      author: 'SummarizerAgent',
      content: {
        parts: [{ text: 'Your weekend plan includes several activities...' }],
        role: 'model'
      }
    }
  ];

  /**
   * Test Case 1: Renders collapsed by default
   * 
   * Verifies that the RawOutput component starts in a collapsed state
   * when first rendered. This ensures a clean UI where the raw JSON
   * data doesn't overwhelm the user unless explicitly requested.
   * 
   * Assertions:
   * - Toggle button is present with "Raw Output" text
   * - aria-expanded attribute is set to "false"
   * - JSON content is NOT visible in the DOM
   */
  it('renders collapsed by default', () => {
    // Render the component with mock data
    render(<RawOutput data={mockData} />);

    // Find the toggle button by its accessible role and name
    const toggleButton = screen.getByRole('button', { name: /raw output/i });
    
    // Verify the button exists and has correct aria-expanded state
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Verify that the JSON content is not visible (collapsed state)
    // The mock data contains 'Sample response' text that should NOT be in DOM
    expect(screen.queryByText(/Sample response/)).not.toBeInTheDocument();
    
    // Also verify the event ID from mock data is not visible
    expect(screen.queryByText(/"id":\s*"1"/)).not.toBeInTheDocument();
  });

  /**
   * Test Case 2: Expands to show content on click
   * 
   * Verifies that clicking the toggle button expands the component
   * to reveal the JSON content. This tests the primary user interaction
   * for viewing raw API response data.
   * 
   * Assertions:
   * - aria-expanded changes to "true" after click
   * - JSON content becomes visible in the DOM
   * - Event data from mock response is displayed
   */
  it('expands to show content on click', () => {
    // Render the component
    render(<RawOutput data={mockData} />);

    // Get the toggle button
    const toggleButton = screen.getByRole('button', { name: /raw output/i });
    
    // Initially should be collapsed
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(toggleButton);

    // Verify aria-expanded is now true
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Verify the JSON content is now visible
    // Check for parts of the stringified JSON that should appear
    expect(screen.getByText(/Sample response/)).toBeInTheDocument();
  });

  /**
   * Test Case 3: Displays JSON in preformatted block
   * 
   * Verifies that when expanded, the JSON data is displayed within
   * a <pre> (preformatted) element for proper formatting and
   * monospace font rendering. This ensures the JSON is readable
   * and maintains its structure.
   * 
   * Assertions:
   * - <pre> element exists in the expanded state
   * - JSON data is contained within the <pre> element
   * - Key data points from mock data are present in the content
   */
  it('displays JSON in preformatted block', () => {
    // Render and expand the component
    const { container } = render(<RawOutput data={mockData} />);
    
    // Click to expand the section
    const toggleButton = screen.getByRole('button', { name: /raw output/i });
    fireEvent.click(toggleButton);

    // Find the <pre> element that should contain the JSON
    const preElement = container.querySelector('pre');
    
    // Verify the pre element exists
    expect(preElement).toBeInTheDocument();
    expect(preElement).not.toBeNull();

    // Verify the pre element contains the stringified JSON data
    // Check for key identifiers from our mock data
    expect(preElement?.textContent).toContain('"id"');
    expect(preElement?.textContent).toContain('"timestamp"');
    expect(preElement?.textContent).toContain('"author"');
    expect(preElement?.textContent).toContain('model');
    expect(preElement?.textContent).toContain('Sample response');
    expect(preElement?.textContent).toContain('SummarizerAgent');
  });

  /**
   * Test Case 4: Collapses when clicked again
   * 
   * Verifies the toggle behavior - clicking the button when expanded
   * should collapse the component and hide the JSON content.
   * This tests the complete expand/collapse cycle.
   * 
   * Assertions:
   * - First click expands (aria-expanded="true", content visible)
   * - Second click collapses (aria-expanded="false", content hidden)
   */
  it('collapses when clicked again', () => {
    // Render the component
    render(<RawOutput data={mockData} />);

    // Get the toggle button
    const toggleButton = screen.getByRole('button', { name: /raw output/i });

    // Initial state: collapsed
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Sample response/)).not.toBeInTheDocument();

    // First click: expand
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Sample response/)).toBeInTheDocument();

    // Second click: collapse
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    
    // Content should be hidden again
    expect(screen.queryByText(/Sample response/)).not.toBeInTheDocument();
  });
});
