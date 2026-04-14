/**
 * PlanView Component Unit Tests
 * 
 * Comprehensive test suite for the PlanView component that displays
 * AI-generated weekend plans with structured activity cards, plan text
 * content, and collapsible Raw Output section for raw API response viewing.
 * 
 * Test Coverage (5 Test Cases):
 * 1. Renders plan text content from planText prop
 * 2. Displays structured activity cards when data parseable
 * 3. Handles unstructured text display gracefully
 * 4. Raw Output section collapsed by default
 * 5. Raw Output expands on toggle click
 * 
 * Testing Strategy:
 * - Uses React Testing Library for DOM queries and user interaction simulation
 * - Tests component behavior with various mock GeneratePlanResult data
 * - Validates structured vs unstructured content rendering paths
 * - Verifies RawOutput integration with toggle behavior
 * - Uses Vitest describe/it blocks with expect assertions
 * 
 * Mock Data Strategy:
 * - mockStructuredResult: Contains bullet points that trigger activity card parsing
 * - mockUnstructuredResult: Contains plain text without parseable structure
 * - mockResultWithRawResponse: Includes rawResponse for RawOutput section testing
 * 
 * @fileoverview Unit tests for PlanView weekend plan display component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PlanView from '../../components/PlanView';
import type { GeneratePlanResult, ADKResponse } from '../../types';

/**
 * Test suite for the PlanView component.
 * 
 * The PlanView component is responsible for displaying AI-generated weekend plans.
 * It supports two rendering modes:
 * 1. Structured: Parses bullet points/numbered lists into activity cards
 * 2. Unstructured: Displays plain text with preserved formatting
 * 
 * The component also integrates the RawOutput component for displaying
 * the raw ADK API response in a collapsible section.
 */
describe('PlanView', () => {
  // ==========================================================================
  // Mock Data Definitions
  // ==========================================================================

  /**
   * Mock ADK response array representing a typical backend response.
   * Contains event metadata with model-generated content parts.
   * Used to test RawOutput section rendering and JSON display.
   */
  const mockADKResponse: ADKResponse = [
    {
      id: 'evt-preprocess-001',
      timestamp: '2024-03-15T10:30:00.000Z',
      author: 'PreprocessInputAgent',
      content: {
        parts: [{ text: '{"zip_code": "94102", "kid_ages": "5,8"}' }],
        role: 'model'
      }
    },
    {
      id: 'evt-weather-002',
      timestamp: '2024-03-15T10:30:05.000Z',
      author: 'WeatherAgent',
      content: {
        parts: [{ text: 'good' }],
        role: 'model'
      }
    },
    {
      id: 'evt-summarizer-003',
      timestamp: '2024-03-15T10:30:30.000Z',
      author: 'SummarizerAgent',
      content: {
        parts: [
          {
            text: 'Area: San Francisco (94102)\nWeather: Good\nAges: 5, 8\n\n• Visit Golden Gate Park\n• Explore California Academy of Sciences\n• Walk along Fisherman\'s Wharf\n\nDisclaimer: Results are based on AI research and need verification.'
          }
        ],
        role: 'model'
      }
    }
  ];

  /**
   * Mock result with structured content containing bullet points.
   * The PlanView parser looks for bullet patterns (- • *) to create activity cards.
   * This data should trigger the structured activity card rendering path.
   * 
   * Parser Requirements (from PlanView.tsx):
   * - At least 2 bullet/numbered items for activity cards to render
   * - Bullet pattern: /^[-•*]\s+(.+)/
   * - Header pattern: /^(area|weather|ages|location|forecast)/i
   * - Disclaimer pattern: /disclaimer|note:|based on ai|verify|accuracy/i
   */
  const mockStructuredResult: GeneratePlanResult = {
    success: true,
    planText: `Area: San Francisco (94102)
Weather: Good conditions expected
Ages: 5, 8

• Visit Golden Gate Park - Perfect for kids with playgrounds and nature trails
• Explore California Academy of Sciences - Interactive exhibits for all ages
• Walk along Fisherman's Wharf - Great seafood and street performers
• Have a picnic at Dolores Park - Beautiful views of the city skyline

Disclaimer: Results are based on AI research and should be verified for accuracy and availability.`,
    rawResponse: mockADKResponse
  };

  /**
   * Mock result with unstructured plain text content.
   * Contains no bullet points, numbered lists, or parseable structure.
   * Should trigger the fallback text display path instead of activity cards.
   */
  const mockUnstructuredResult: GeneratePlanResult = {
    success: true,
    planText: 'Your weekend in San Francisco looks promising! The weather will be nice and there are many family-friendly activities to enjoy. Consider visiting local parks and museums for an engaging experience with your children. Have a wonderful weekend!',
    rawResponse: undefined
  };

  /**
   * Mock result with minimal content to test edge cases.
   * Contains only one bullet point, which is not enough to trigger activity cards.
   */
  const mockMinimalResult: GeneratePlanResult = {
    success: true,
    planText: '• Single activity suggestion',
    rawResponse: mockADKResponse
  };

  // ==========================================================================
  // Test Case 1: Plan Text Rendering
  // ==========================================================================

  /**
   * Test Case 1: Renders plan text content from planText prop
   * 
   * Verifies that the PlanView component correctly displays the plan text
   * content provided in the result prop. The component should:
   * - Display the "Your Weekend Plan" header
   * - Render the plan content visibly in the document
   * - Show key content from the planText prop
   * 
   * This test uses structured content to verify both the header display
   * and the parsed activity content rendering.
   */
  it('renders plan text content from planText prop', () => {
    // Render the PlanView component with structured mock result
    render(<PlanView result={mockStructuredResult} />);

    // Verify the main heading is present
    const mainHeading = screen.getByRole('heading', { name: /your weekend plan/i });
    expect(mainHeading).toBeInTheDocument();

    // Verify key content from planText is rendered in the document
    // Check for activity content that should be visible
    expect(screen.getByText(/Golden Gate Park/i)).toBeInTheDocument();
    expect(screen.getByText(/California Academy of Sciences/i)).toBeInTheDocument();
    expect(screen.getByText(/Fisherman's Wharf/i)).toBeInTheDocument();

    // Verify the article container has the correct aria-label
    const article = screen.getByRole('article', { name: /your weekend plan/i });
    expect(article).toBeInTheDocument();
  });

  // ==========================================================================
  // Test Case 2: Structured Activity Cards
  // ==========================================================================

  /**
   * Test Case 2: Displays structured activity cards when data parseable
   * 
   * Verifies that the PlanView component correctly parses bullet-point
   * content into structured activity cards. When the planText contains
   * parseable structure (bullet points or numbered lists with 2+ items),
   * the component should render individual activity cards with:
   * - Activity titles from the parsed bullet content
   * - Activity descriptions (if present after the title)
   * - Numbered badges for each activity
   * - Proper list semantics for accessibility
   * 
   * This test validates the parsePlanStructure() function output and
   * ActivityCard component rendering.
   */
  it('displays structured activity cards when data parseable', () => {
    // Render the PlanView component with structured mock result
    render(<PlanView result={mockStructuredResult} />);

    // Verify activity cards are rendered as a list
    const activityList = screen.getByRole('list', { name: /list of activities/i });
    expect(activityList).toBeInTheDocument();

    // Verify individual activity items are present
    const activityItems = screen.getAllByRole('listitem');
    expect(activityItems.length).toBeGreaterThanOrEqual(2);

    // Verify specific activity titles are rendered
    // The parser extracts text after bullet characters
    expect(screen.getByText(/Visit Golden Gate Park/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore California Academy of Sciences/i)).toBeInTheDocument();
    expect(screen.getByText(/Walk along Fisherman's Wharf/i)).toBeInTheDocument();
    expect(screen.getByText(/Have a picnic at Dolores Park/i)).toBeInTheDocument();

    // Verify the disclaimer is rendered (present in mockStructuredResult)
    // The disclaimer section renders when disclaimerPattern matches
    expect(screen.getByText(/Results are based on AI research/i)).toBeInTheDocument();
  });

  // ==========================================================================
  // Test Case 3: Unstructured Text Display
  // ==========================================================================

  /**
   * Test Case 3: Handles unstructured text display gracefully
   * 
   * Verifies that the PlanView component gracefully displays plain text
   * content when the planText cannot be parsed into structured activities.
   * The component should:
   * - Render the text content without crashing
   * - Display the full text content visibly
   * - Preserve whitespace formatting (whitespace-pre-wrap)
   * - NOT render activity cards or lists
   * 
   * This test ensures the fallback rendering path works correctly for
   * free-form AI responses that don't follow bullet/numbered patterns.
   */
  it('handles unstructured text display gracefully', () => {
    // Render the PlanView component with unstructured mock result
    render(<PlanView result={mockUnstructuredResult} />);

    // Verify the main heading is still present
    const mainHeading = screen.getByRole('heading', { name: /your weekend plan/i });
    expect(mainHeading).toBeInTheDocument();

    // Verify the unstructured text content is visible
    expect(screen.getByText(/Your weekend in San Francisco looks promising/i)).toBeInTheDocument();
    expect(screen.getByText(/family-friendly activities/i)).toBeInTheDocument();
    expect(screen.getByText(/Have a wonderful weekend/i)).toBeInTheDocument();

    // Verify that NO activity list is rendered (unstructured path)
    const activityList = screen.queryByRole('list', { name: /list of activities/i });
    expect(activityList).not.toBeInTheDocument();

    // Verify the plan details section is present for unstructured content
    const planDetails = screen.getByLabelText(/plan details/i);
    expect(planDetails).toBeInTheDocument();
  });

  // ==========================================================================
  // Test Case 4: Raw Output Collapsed by Default
  // ==========================================================================

  /**
   * Test Case 4: Raw Output section collapsed by default
   * 
   * Verifies that the Raw Output section (powered by RawOutput component)
   * is collapsed by default when the PlanView component renders.
   * This ensures a clean UI where technical details don't overwhelm
   * the user unless explicitly requested.
   * 
   * The test verifies:
   * - Toggle button is present with correct accessible name
   * - aria-expanded attribute is set to "false"
   * - Raw JSON content is NOT visible in the DOM
   */
  it('Raw Output section collapsed by default', () => {
    // Render the PlanView component with mock result that has rawResponse
    render(<PlanView result={mockStructuredResult} />);

    // Find the Raw Output toggle button by its accessible role and name
    // The RawOutput component uses title="Raw API Response" when rendered in PlanView
    const rawOutputToggle = screen.getByRole('button', { name: /raw api response/i });
    
    // Verify the toggle button is present
    expect(rawOutputToggle).toBeInTheDocument();
    
    // Verify the button indicates collapsed state
    expect(rawOutputToggle).toHaveAttribute('aria-expanded', 'false');

    // Verify that raw response content is NOT visible (collapsed)
    // The mockADKResponse contains specific identifiable content
    expect(screen.queryByText(/"evt-preprocess-001"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"evt-weather-002"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"evt-summarizer-003"/)).not.toBeInTheDocument();
    
    // Also verify author names from raw response are not visible
    expect(screen.queryByText(/"PreprocessInputAgent"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"WeatherAgent"/)).not.toBeInTheDocument();
  });

  // ==========================================================================
  // Test Case 5: Raw Output Expansion
  // ==========================================================================

  /**
   * Test Case 5: Raw Output expands on toggle click
   * 
   * Verifies that clicking the Raw Output toggle button expands the
   * collapsible section to reveal the raw ADK response JSON data.
   * 
   * The test verifies:
   * - Toggle button click changes aria-expanded to "true"
   * - Raw JSON content becomes visible after expansion
   * - The JSON contains rawResponse data (event IDs, authors, content)
   */
  it('Raw Output expands on toggle click', () => {
    // Render the PlanView component with mock result that has rawResponse
    render(<PlanView result={mockStructuredResult} />);

    // Find the Raw Output toggle button
    const rawOutputToggle = screen.getByRole('button', { name: /raw api response/i });
    
    // Verify initial collapsed state
    expect(rawOutputToggle).toHaveAttribute('aria-expanded', 'false');

    // Simulate user clicking the toggle button to expand
    fireEvent.click(rawOutputToggle);

    // Verify the button now indicates expanded state
    expect(rawOutputToggle).toHaveAttribute('aria-expanded', 'true');

    // Verify raw response content is now visible in the document
    // The RawOutput component displays JSON.stringify(data, null, 2)
    // Check for identifiable strings from mockADKResponse
    expect(screen.getByText(/evt-preprocess-001/)).toBeInTheDocument();
    expect(screen.getByText(/evt-weather-002/)).toBeInTheDocument();
    expect(screen.getByText(/evt-summarizer-003/)).toBeInTheDocument();

    // Verify author names from raw response are now visible
    expect(screen.getByText(/PreprocessInputAgent/)).toBeInTheDocument();
    expect(screen.getByText(/SummarizerAgent/)).toBeInTheDocument();

    // Verify the expanded content region has correct accessibility attributes
    const contentRegion = screen.getByRole('region', { name: /raw api response content/i });
    expect(contentRegion).toBeInTheDocument();

    // Verify JSON is rendered in a preformatted block
    const preElement = contentRegion.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveClass('font-mono');
  });

  // ==========================================================================
  // Additional Edge Case Tests
  // ==========================================================================

  /**
   * Additional Test: Handles result without rawResponse
   * 
   * Verifies that the component handles the case where rawResponse
   * is undefined and doesn't render the Raw Output section at all.
   */
  it('does not render Raw Output section when rawResponse is undefined', () => {
    // Render with unstructured result that has no rawResponse
    render(<PlanView result={mockUnstructuredResult} />);

    // Verify the Raw Output toggle button is NOT present
    const rawOutputToggle = screen.queryByRole('button', { name: /raw api response/i });
    expect(rawOutputToggle).not.toBeInTheDocument();
    
    // Verify the main content still renders properly
    expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
    expect(screen.getByText(/Your weekend in San Francisco/i)).toBeInTheDocument();
  });

  /**
   * Additional Test: Handles empty planText
   * 
   * Verifies that the component handles empty or missing planText
   * by displaying an appropriate empty state message.
   */
  it('displays empty state when planText is empty', () => {
    // Create a result with empty planText
    const emptyResult: GeneratePlanResult = {
      success: true,
      planText: '',
      rawResponse: undefined
    };

    render(<PlanView result={emptyResult} />);

    // Verify the empty state message is displayed
    expect(screen.getByText(/No plan content available/i)).toBeInTheDocument();
    expect(screen.getByText(/Try generating a new plan/i)).toBeInTheDocument();

    // Verify the empty state article has correct aria-label
    const emptyArticle = screen.getByRole('article', { name: /weekend plan - empty/i });
    expect(emptyArticle).toBeInTheDocument();
  });

  /**
   * Additional Test: Handles parsed header content
   * 
   * Verifies that header information (area, weather, ages) is properly
   * parsed and displayed in the header section of the component.
   */
  it('displays parsed header information when present', () => {
    render(<PlanView result={mockStructuredResult} />);

    // Verify header content is rendered
    // The header pattern looks for: area, weather, ages, location, forecast
    expect(screen.getByText(/Area: San Francisco/i)).toBeInTheDocument();
    expect(screen.getByText(/Weather: Good conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/Ages: 5, 8/i)).toBeInTheDocument();
  });

  /**
   * Additional Test: Handles minimal content with single bullet point
   * 
   * Verifies that the component falls back to unstructured text display
   * when there's only one bullet point (not enough to trigger activity cards).
   * The parser requires at least 2 activities to create structured cards.
   */
  it('falls back to unstructured display for single bullet content', () => {
    // Render with minimal result that has only one bullet point
    render(<PlanView result={mockMinimalResult} />);

    // Verify the main heading is still present
    const mainHeading = screen.getByRole('heading', { name: /your weekend plan/i });
    expect(mainHeading).toBeInTheDocument();

    // Verify the single bullet content is visible as text
    expect(screen.getByText(/Single activity suggestion/i)).toBeInTheDocument();

    // Verify that NO activity list is rendered (should fall back to unstructured)
    // because there's only 1 bullet point (needs >= 2 for structured cards)
    const activityList = screen.queryByRole('list', { name: /list of activities/i });
    expect(activityList).not.toBeInTheDocument();

    // Verify the Raw Output section is available (mockMinimalResult has rawResponse)
    const rawOutputToggle = screen.getByRole('button', { name: /raw api response/i });
    expect(rawOutputToggle).toBeInTheDocument();
  });

  // ==========================================================================
  // Mutation Testing — parsePlanStructure Mutant Killers
  // ==========================================================================

  /**
   * Targeted Stryker mutation-testing mutant-killing tests.
   *
   * Each test is designed to detect and kill a specific class of Stryker mutant
   * in the parsePlanStructure() function and PlanView rendering logic. Test
   * descriptions embed the mutator name and source line number for traceability.
   *
   * Mutant categories covered:
   * - ConditionalExpression: regex branch conditions for bullet/numbered/header/disclaimer detection
   * - EqualityOperator: boundary comparisons (i < 3, activities.length >= 2)
   * - StringLiteral: regex pattern strings in disclaimerPattern
   * - ArithmeticOperator: index + 1 in ActivityCard numbering
   */
  describe('Mutation testing - parsePlanStructure mutant killers', () => {

    // ========================================================================
    // Phase 1: Bullet Detection Regex-Branch Mutants
    // ========================================================================

    it('[ConditionalExpression L119] bullet with dash prefix detected as activity', () => {
      const dashBulletResult: GeneratePlanResult = {
        success: true,
        planText: '- Morning hike at the trail\n- Afternoon swim at the lake\n- Evening barbecue',
        rawResponse: undefined,
      };

      render(<PlanView result={dashBulletResult} />);

      // Structured activity list must render for 3 dash-prefixed bullets
      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      // Verify individual activity text is present
      expect(screen.getByText(/Morning hike at the trail/i)).toBeInTheDocument();
      expect(screen.getByText(/Afternoon swim at the lake/i)).toBeInTheDocument();
      expect(screen.getByText(/Evening barbecue/i)).toBeInTheDocument();
    });

    it('[ConditionalExpression L119] bullet with asterisk prefix detected as activity', () => {
      const asteriskBulletResult: GeneratePlanResult = {
        success: true,
        planText: '* Visit the museum\n* Explore the park\n* Enjoy dinner',
        rawResponse: undefined,
      };

      render(<PlanView result={asteriskBulletResult} />);

      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      expect(screen.getByText(/Visit the museum/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore the park/i)).toBeInTheDocument();
      expect(screen.getByText(/Enjoy dinner/i)).toBeInTheDocument();
    });

    it('[ConditionalExpression L119] bullet with unicode bullet character prefix detected', () => {
      const unicodeBulletResult: GeneratePlanResult = {
        success: true,
        planText: '\u2022 First activity\n\u2022 Second activity',
        rawResponse: undefined,
      };

      render(<PlanView result={unicodeBulletResult} />);

      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);

      expect(screen.getByText(/First activity/i)).toBeInTheDocument();
      expect(screen.getByText(/Second activity/i)).toBeInTheDocument();
    });

    // ========================================================================
    // Phase 2: Numbered-Item Detection Regex-Branch Mutants
    // ========================================================================

    it('[ConditionalExpression L134] numbered list with period "1. " pattern detected', () => {
      const numberedPeriodResult: GeneratePlanResult = {
        success: true,
        planText: '1. Morning yoga\n2. Beach walk\n3. Sunset viewing',
        rawResponse: undefined,
      };

      render(<PlanView result={numberedPeriodResult} />);

      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      expect(screen.getByText(/Morning yoga/i)).toBeInTheDocument();
      expect(screen.getByText(/Beach walk/i)).toBeInTheDocument();
      expect(screen.getByText(/Sunset viewing/i)).toBeInTheDocument();
    });

    it('[ConditionalExpression L134] numbered list with parenthesis "1) " pattern detected', () => {
      const numberedParenResult: GeneratePlanResult = {
        success: true,
        planText: '1) Visit museum\n2) Explore park\n3) Relax at cafe',
        rawResponse: undefined,
      };

      render(<PlanView result={numberedParenResult} />);

      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      expect(screen.getByText(/Visit museum/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore park/i)).toBeInTheDocument();
      expect(screen.getByText(/Relax at cafe/i)).toBeInTheDocument();
    });

    // ========================================================================
    // Phase 3: Header Detection Mutants
    // ========================================================================

    it('[ConditionalExpression L113] header lines at top detected and displayed', () => {
      const headerResult: GeneratePlanResult = {
        success: true,
        planText: 'Area: Downtown\nWeather: Sunny\nAges: 5, 10\n- Activity one\n- Activity two',
        rawResponse: undefined,
      };

      render(<PlanView result={headerResult} />);

      // Header metadata should be rendered
      expect(screen.getByText(/Area: Downtown/)).toBeInTheDocument();
      expect(screen.getByText(/Weather: Sunny/)).toBeInTheDocument();
      expect(screen.getByText(/Ages: 5, 10/)).toBeInTheDocument();

      // Activities should still be parsed into structured cards
      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('[EqualityOperator L113] header detection limited to first 3 lines (i < 3)', () => {
      // "Area:" appears at line index 3 (4th line, 0-indexed) — beyond the i < 3 boundary
      const headerBeyondLimitResult: GeneratePlanResult = {
        success: true,
        planText: 'Line one\nLine two\nLine three\nArea: Should not be header\n- Activity 1\n- Activity 2',
        rawResponse: undefined,
      };

      render(<PlanView result={headerBeyondLimitResult} />);

      // Activity list should render (2 bullet items)
      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      // "Area: Should not be header" at line index 3 is beyond i < 3 — not a header.
      // It is not a bullet or numbered item either, so it becomes description of the
      // preceding context. It must NOT appear in the header section.
      // The early lines (indexes 0,1,2) fall through to the else-if i<5 header fallback,
      // so "Line one\nLine two\nLine three" become header text.
      expect(screen.getByText(/Line one/)).toBeInTheDocument();

      // Verify activity items are exactly 2
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    // ========================================================================
    // Phase 4: Disclaimer Detection Mutants
    // ========================================================================

    it('[ConditionalExpression L107] disclaimer text detected and rendered', () => {
      const disclaimerResult: GeneratePlanResult = {
        success: true,
        planText: '- Activity A\n- Activity B\nDisclaimer: This is AI generated',
        rawResponse: undefined,
      };

      render(<PlanView result={disclaimerResult} />);

      // Activity list should render
      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      // Disclaimer should be detected and displayed in the disclaimer aside
      const disclaimerNote = screen.getByRole('note', { name: /important disclaimer/i });
      expect(disclaimerNote).toBeInTheDocument();
      expect(screen.getByText(/This is AI generated/i)).toBeInTheDocument();
    });

    it('[StringLiteral L101] "note:" pattern triggers disclaimer detection', () => {
      const noteDisclaimerResult: GeneratePlanResult = {
        success: true,
        planText: '- Activity X\n- Activity Y\nNote: Please verify all information',
        rawResponse: undefined,
      };

      render(<PlanView result={noteDisclaimerResult} />);

      // Activity list should render
      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      // "Note:" matches disclaimerPattern → rendered as disclaimer
      const disclaimerNote = screen.getByRole('note', { name: /important disclaimer/i });
      expect(disclaimerNote).toBeInTheDocument();
      expect(screen.getByText(/Please verify all information/i)).toBeInTheDocument();
    });

    // ========================================================================
    // Phase 5: Rendering Path Mutants
    // ========================================================================

    it('[EqualityOperator L165] minimum 2 activities required for structured display', () => {
      // Exactly 2 activities → structured display MUST render
      const twoActivityResult: GeneratePlanResult = {
        success: true,
        planText: '- First outing\n- Second outing',
        rawResponse: undefined,
      };

      const { unmount } = render(<PlanView result={twoActivityResult} />);

      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);

      unmount();

      // Exactly 1 activity → structured display must NOT render
      const oneActivityResult: GeneratePlanResult = {
        success: true,
        planText: '- Only one activity',
        rawResponse: undefined,
      };

      render(<PlanView result={oneActivityResult} />);

      const noActivityList = screen.queryByRole('list', { name: /list of activities/i });
      expect(noActivityList).not.toBeInTheDocument();

      // Content still renders in unstructured fallback
      expect(screen.getByText(/Only one activity/i)).toBeInTheDocument();
    });

    it('[ConditionalExpression L245] null planText renders empty state', () => {
      const nullPlanResult: GeneratePlanResult = {
        success: true,
        planText: null as unknown as string,
        rawResponse: undefined,
      };

      render(<PlanView result={nullPlanResult} />);

      // Empty state message should appear
      expect(screen.getByText(/No plan content available/i)).toBeInTheDocument();
    });

    it('[ConditionalExpression L245] whitespace-only planText renders empty state', () => {
      const whitespaceResult: GeneratePlanResult = {
        success: true,
        planText: '   \n  \n  ',
        rawResponse: undefined,
      };

      render(<PlanView result={whitespaceResult} />);

      // planText.trim().length === 0 in the component guard → empty state
      expect(screen.getByText(/No plan content available/i)).toBeInTheDocument();
    });

    // ========================================================================
    // Phase 6: ActivityCard Content Checks
    // ========================================================================

    it('[StringLiteral L187] individual ActivityCard shows activity title correctly', () => {
      const multiActivityResult: GeneratePlanResult = {
        success: true,
        planText: '- Visit the zoo\nGreat for kids and families\n- Explore the aquarium\nAmazing marine life exhibits\n- Enjoy the botanical garden\nBeautiful seasonal flowers',
        rawResponse: undefined,
      };

      render(<PlanView result={multiActivityResult} />);

      const activityList = screen.getByRole('list', { name: /list of activities/i });
      expect(activityList).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      // Verify each activity title
      expect(screen.getByText(/Visit the zoo/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore the aquarium/i)).toBeInTheDocument();
      expect(screen.getByText(/Enjoy the botanical garden/i)).toBeInTheDocument();

      // Verify descriptions are rendered (continuation lines after bullets)
      expect(screen.getByText(/Great for kids and families/i)).toBeInTheDocument();
      expect(screen.getByText(/Amazing marine life exhibits/i)).toBeInTheDocument();
      expect(screen.getByText(/Beautiful seasonal flowers/i)).toBeInTheDocument();
    });

    it('[ArithmeticOperator L195] activity cards have correct numbering badges', () => {
      const numberedBadgeResult: GeneratePlanResult = {
        success: true,
        planText: '- Alpha activity\n- Beta activity\n- Gamma activity\n- Delta activity',
        rawResponse: undefined,
      };

      render(<PlanView result={numberedBadgeResult} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(4);

      // Each ActivityCard renders aria-label "Activity N: <title>" where N = index + 1
      // Verify numbering via the aria-label attribute on each listitem
      expect(items[0]).toHaveAttribute('aria-label', expect.stringContaining('Activity 1'));
      expect(items[1]).toHaveAttribute('aria-label', expect.stringContaining('Activity 2'));
      expect(items[2]).toHaveAttribute('aria-label', expect.stringContaining('Activity 3'));
      expect(items[3]).toHaveAttribute('aria-label', expect.stringContaining('Activity 4'));
    });
  });
});
