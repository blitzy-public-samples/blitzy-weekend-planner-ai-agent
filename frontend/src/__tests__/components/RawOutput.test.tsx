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

  // =========================================================================
  // Stryker Mutation-Testing Targeted Tests
  // Each test targets a specific Stryker mutant category to kill surviving
  // mutants identified from the mutation testing baseline run.
  // =========================================================================

  /**
   * BooleanLiteral Mutant Killer — Test 5
   *
   * Targets the BooleanLiteral mutant on line 65 where
   * `useState<boolean>(false)` could be mutated to `useState<boolean>(true)`.
   * Explicitly verifies BOTH the aria-expanded attribute value AND
   * the absence of the content region in the initial render.
   */
  it('[BooleanLiteral L65] isOpen state initialization starts collapsed', () => {
    render(<RawOutput data={mockData} />);

    // The toggle button must have aria-expanded="false" initially
    const btn = screen.getByRole('button', { name: /raw output/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    // The content region must NOT exist in the DOM when collapsed
    // A BooleanLiteral mutant flipping false→true would cause this to exist
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  /**
   * BooleanLiteral Mutant Killer — Test 6
   *
   * Second BooleanLiteral mutant killer for line 65.
   * Verifies that the named region AND the <pre> element are both
   * absent on initial render. If useState(false) is mutated to
   * useState(true), the <pre> element would be present immediately.
   */
  it('[BooleanLiteral L65] content is not rendered when component initializes', () => {
    const { container } = render(<RawOutput data={mockData} />);

    // Named content region must not exist initially
    expect(
      screen.queryByRole('region', { name: /raw output content/i })
    ).not.toBeInTheDocument();

    // The <pre> element containing JSON must not be in the DOM
    expect(container.querySelector('pre')).toBeNull();
  });

  /**
   * StringLiteral Mutant Killer — Test 7
   *
   * Targets StringLiteral mutants on the aria-expanded attribute (line 90).
   * Uses exact string matching for "false" and "true" values to catch
   * mutations that alter the attribute string literals.
   */
  it('[StringLiteral L90] aria-expanded is exactly "false" then exactly "true" after toggle', () => {
    render(<RawOutput data={mockData} />);

    const btn = screen.getByRole('button', { name: /raw output/i });

    // Exact string match "false" — catches StringLiteral mutant on attribute
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn);

    // Exact string match "true" — catches StringLiteral mutant on attribute
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * StringLiteral Mutant Killer — Test 8
   *
   * Targets StringLiteral mutant on contentId = 'raw-output-content' (line 71).
   * Verifies aria-controls on the button matches the id of the content region
   * when expanded, ensuring the two are linked by the same string constant.
   */
  it('[StringLiteral L91] aria-controls links to content id', () => {
    render(<RawOutput data={mockData} />);

    const btn = screen.getByRole('button', { name: /raw output/i });

    // Expand the section to make the content region appear
    fireEvent.click(btn);

    // The button's aria-controls must point to exact content id string
    expect(btn).toHaveAttribute('aria-controls', 'raw-output-content');

    // The content region must have the matching id attribute
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('id', 'raw-output-content');
  });

  /**
   * ConditionalExpression Mutant Killer — Test 9
   *
   * Targets the ConditionalExpression mutant on line 116 where
   * `{isExpanded && (...)}` could be mutated to `{true && (...)}`
   * or `{false && (...)}`. Verifies the <pre> element is absent
   * before toggling and present after toggling with correct JSON content.
   */
  it('[ConditionalExpression L116] JSON content hidden before toggle, visible after', () => {
    const { container } = render(<RawOutput data={mockData} />);

    // Before toggle: <pre> must not exist in the DOM
    expect(container.querySelector('pre')).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByRole('button', { name: /raw output/i }));

    // After toggle: <pre> must exist with JSON content
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain('Sample response');
    expect(pre?.textContent).toContain('SummarizerAgent');
  });

  /**
   * ConditionalExpression Mutant Killer — Test 10
   *
   * Second ConditionalExpression killer for line 116.
   * Verifies the role="region" element is conditionally rendered
   * and carries the correct aria-label linking it to the title.
   */
  it('[ConditionalExpression L116] region element only exists when expanded', () => {
    render(<RawOutput data={mockData} />);

    // Before toggle: region must not exist
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByRole('button', { name: /raw output/i }));

    // After toggle: region must exist with correct aria-label
    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'Raw Output content');
  });

  /**
   * StringLiteral Mutant Killer — Test 11
   *
   * Targets StringLiteral mutants in JSON.stringify formatting (line 124).
   * Uses deeply nested data to ensure the entire object graph is correctly
   * serialized and rendered in the <pre> element.
   */
  it('[StringLiteral] renders deeply nested object data correctly', () => {
    // Create data with deep nesting to exercise JSON.stringify fully
    const nestedData = [
      {
        id: '1',
        timestamp: 'now',
        author: 'test',
        content: {
          role: 'model',
          parts: [{ text: 'deep' }]
        },
        nested: { level1: { level2: { value: 'deep_value' } } }
      }
    ] as unknown as ADKResponse;

    const { container } = render(<RawOutput data={nestedData} />);

    // Expand the section
    fireEvent.click(screen.getByRole('button', { name: /raw output/i }));

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    // Verify deeply nested value is present in the formatted JSON output
    expect(pre?.textContent).toContain('deep_value');
    expect(pre?.textContent).toContain('level2');
  });

  /**
   * StringLiteral Mutant Killer — Test 12
   *
   * Targets StringLiteral mutants around JSON.stringify edge cases.
   * Verifies that empty arrays and minimal data structures are rendered
   * correctly in the <pre> block.
   */
  it('[StringLiteral] renders array and null values in JSON data', () => {
    const edgeCaseData: ADKResponse = [
      {
        id: '1',
        timestamp: 'now',
        author: 'test',
        content: {
          role: 'model',
          parts: []
        }
      }
    ];

    const { container } = render(<RawOutput data={edgeCaseData} />);

    // Expand the section
    fireEvent.click(screen.getByRole('button', { name: /raw output/i }));

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    // Verify the empty parts array is correctly rendered in the JSON
    expect(pre?.textContent).toContain('"parts": []');
  });

  /**
   * StringLiteral Mutant Killer — Test 13
   *
   * Targets StringLiteral mutants on the JSON.stringify parameters (null, 2)
   * on line 124. Uses exact `toBe` matching against the expected
   * JSON.stringify output to catch any mutation of the formatting arguments.
   */
  it('[StringLiteral] pre element contains full JSON.stringify output', () => {
    const { container } = render(<RawOutput data={mockData} />);

    // Expand the section
    fireEvent.click(screen.getByRole('button', { name: /raw output/i }));

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    // Exact match ensures JSON.stringify(data, null, 2) parameters are correct
    // Mutating null or 2 would change the formatting and fail this assertion
    expect(pre?.textContent).toBe(JSON.stringify(mockData, null, 2));
  });
});
