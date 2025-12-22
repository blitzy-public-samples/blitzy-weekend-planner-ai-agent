/**
 * Type definitions for the Weekend Planner frontend application.
 * These types define the contract between the frontend and ADK backend API.
 * 
 * @fileoverview Core TypeScript interfaces and types for:
 * - Form input data (GeneratePlanInput)
 * - ADK backend response structures (ADKEvent, ADKResponse)
 * - API result handling (GeneratePlanResult, PlanError)
 */

/**
 * Input data structure for generating a weekend plan.
 * This interface represents the form data collected from the user
 * and passed to the API client for plan generation.
 * 
 * The form contains two fields:
 * - Zip Code (required): User's location for the weekend plan
 * - Kids Ages (optional): Array of children's ages for family-friendly recommendations
 * 
 * @example
 * const input: GeneratePlanInput = {
 *   location: "94105",
 *   kidsAges: [5, 8, 12]
 * };
 */
export interface GeneratePlanInput {
  /**
   * Zip Code for the weekend trip location.
   * This field is required for plan generation.
   * Should be a valid US zip code or location identifier.
   * 
   * Note: The property is named 'location' for API compatibility,
   * but represents "Zip Code" in the UI form.
   * 
   * @example "94105" or "02138"
   */
  location: string;

  /**
   * Array of children's ages for family-friendly activity recommendations.
   * Each age must be a valid integer where 0 < age < 120.
   * 
   * This field is optional - an empty array indicates no children
   * or that child-specific recommendations are not needed.
   * 
   * The frontend parses comma-separated input (e.g., "5, 8, 12")
   * into this numeric array format before API submission.
   * 
   * @example [5, 8, 12] or [] for no children
   */
  kidsAges: number[];
}

/**
 * Content part structure within ADK messages.
 * Represents a single part of the message content,
 * typically containing text from the AI model response.
 */
export interface MessagePart {
  /**
   * Text content of the message part.
   * Optional because some parts may contain other content types
   * (though text is the primary format for this application).
   */
  text?: string;
}

/**
 * Content structure within ADK event.
 * Contains the full message content with role attribution
 * and an array of content parts.
 */
export interface MessageContent {
  /**
   * Array of content parts that make up the message.
   * Typically contains one or more MessagePart objects with text.
   */
  parts: MessagePart[];

  /**
   * Role of the content author.
   * - "model": AI-generated response from the ADK agent
   * - "user": User input message
   * - Other values may be used for system messages or tool outputs
   */
  role: 'model' | 'user' | string;
}

/**
 * ADK event structure returned from the session endpoint.
 * Each event represents a step in the agent pipeline execution,
 * with metadata and optional content from the AI model.
 * 
 * Events are returned as an array (ADKResponse) from the backend,
 * and the frontend extracts the final model response to display.
 */
export interface ADKEvent {
  /**
   * Unique identifier for the event.
   * Used to distinguish between different events in the response.
   */
  id: string;

  /**
   * ISO8601 timestamp of when the event was generated.
   * @example "2024-03-15T10:30:00.000Z"
   */
  timestamp: string;

  /**
   * Author of the event.
   * - "model" for AI responses from the gemini model
   * - Agent names (e.g., "PreprocessInputAgent", "SummarizerAgent")
   * - Other identifiers for different pipeline stages
   */
  author: string;

  /**
   * Optional content of the event.
   * Present when the event contains message content.
   * May be undefined for events without displayable content.
   */
  content?: MessageContent;
}

/**
 * Array of ADK events returned from the session API endpoint.
 * The response contains multiple events representing the full
 * agent pipeline execution. The frontend typically extracts
 * the final "model" author event for display.
 * 
 * @example
 * // Response from POST /apps/WeekendPlanner/users/{userId}/sessions/{sessionId}
 * const response: ADKResponse = [
 *   { id: "1", timestamp: "...", author: "PreprocessInputAgent", content: {...} },
 *   { id: "2", timestamp: "...", author: "WeatherAgent", content: {...} },
 *   { id: "3", timestamp: "...", author: "model", content: { parts: [{ text: "Your weekend plan..." }], role: "model" } }
 * ];
 */
export type ADKResponse = ADKEvent[];

/**
 * Error details for API responses.
 * Contains structured error information for display to users
 * and debugging purposes.
 */
export interface PlanError {
  /**
   * User-friendly error message describing what went wrong.
   * This message is suitable for display in the UI.
   * @example "Couldn't reach the backend. Make sure the ADK server is running."
   */
  message: string;

  /**
   * HTTP status code if available.
   * Useful for determining the type of error (4xx client, 5xx server).
   * @example 400, 500, 502
   */
  statusCode?: number;

  /**
   * Raw error body from the server response.
   * Contains the full error details for technical debugging.
   * Displayed in the expandable "Technical Details" section.
   */
  body?: string;
}

/**
 * API error structure used throughout the application.
 * Contains structured error information for display to users
 * and debugging purposes. Used by API client and error display components.
 */
export interface ApiError {
  /**
   * User-friendly error message describing what went wrong.
   * This message is suitable for display in the UI.
   * @example "Couldn't reach the backend. Make sure the ADK server is running."
   */
  message: string;

  /**
   * HTTP status code if available.
   * Useful for determining the type of error (4xx client, 5xx server).
   * @example 400, 500, 502
   */
  statusCode?: number;

  /**
   * Raw error body from the server response.
   * Contains the full error details for technical debugging.
   * Displayed in the expandable "Technical Details" section.
   */
  rawBody?: string;
}

/**
 * Result structure for plan generation API calls.
 * Represents either a successful plan generation or an error state.
 * Used as the return type for the generatePlan() API client function.
 * 
 * @example
 * // Success case
 * const successResult: GeneratePlanResult = {
 *   success: true,
 *   planText: "Here's your weekend plan for San Francisco...",
 *   rawResponse: [{ id: "1", timestamp: "...", author: "model", content: {...} }]
 * };
 * 
 * @example
 * // Error case
 * const errorResult: GeneratePlanResult = {
 *   success: false,
 *   error: {
 *     message: "Request timed out. Please try again.",
 *     statusCode: 408
 *   }
 * };
 */
export interface GeneratePlanResult {
  /**
   * Whether the plan generation request was successful.
   * When true, planText and rawResponse are available.
   * When false, error contains details about what went wrong.
   */
  success: boolean;

  /**
   * Extracted plan text content from the AI response.
   * This is the human-readable plan to display to the user.
   * Only present when success is true.
   */
  planText?: string;

  /**
   * Raw ADK response for debugging and raw output display.
   * Contains the full array of events from the agent pipeline.
   * Displayed in the collapsible "Raw Output" section.
   * Only present when success is true.
   */
  rawResponse?: ADKResponse;

  /**
   * Error details if the request failed.
   * Contains user-friendly message and technical details.
   * Only present when success is false.
   */
  error?: PlanError;
}

/**
 * Request body structure for the ADK session endpoint.
 * Used internally by the API client to construct plan generation requests.
 * 
 * The API uses a two-step session-based flow:
 * 1. Create session with empty body: POST /apps/WeekendPlanner/users/{userId}/sessions/{sessionId}
 * 2. Send message with new_message: POST to the same endpoint
 * 
 * This interface represents the body for step 2 (message sending).
 * Step 1 (session creation) uses an empty object {}.
 */
export interface ADKRunRequest {
  /**
   * The new message to send to the agent.
   * Contains the user's plan request with location and optional kids ages.
   */
  new_message: {
    /**
     * Role of the message sender.
     * Always "user" for frontend-originated messages.
     */
    role: 'user';

    /**
     * Content parts of the message.
     * Contains the formatted plan request text.
     */
    parts: MessagePart[];
  };
}

/**
 * Application state type for the main App component.
 * Represents the different UI states during plan generation.
 */
export type AppState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Form validation error structure.
 * Maps field names to their error messages.
 * 
 * The form contains two fields:
 * - location (Zip Code): Required field
 * - kidsAges: Optional field with format validation
 */
export interface FormValidationErrors {
  /**
   * Error message for the Zip Code (location) field.
   * Displayed when the required Zip Code is empty or invalid.
   */
  location?: string;

  /**
   * Error message for the kids ages field.
   * Displayed when the comma-separated ages format is invalid
   * or when ages are outside the valid range (0 < age < 120).
   */
  kidsAges?: string;
}
