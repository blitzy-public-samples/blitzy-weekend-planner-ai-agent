/**
 * Type definitions for the Weekend Planner frontend application.
 * These types define the contract between the frontend and ADK backend API.
 */

/**
 * Input data structure for generating a weekend plan
 */
export interface GeneratePlanInput {
  /** Location for the weekend trip (city name or zip code) */
  location: string;
  /** Start date of the weekend in YYYY-MM-DD format */
  startDate: string;
  /** End date of the weekend in YYYY-MM-DD format */
  endDate: string;
  /** Optional comma-separated list of children's ages (e.g., "3, 7, 12") */
  kidsAges?: string;
  /** Optional free-form text describing activity preferences */
  preferences?: string;
}

/**
 * Content part structure within ADK messages
 */
export interface ADKContentPart {
  /** Text content of the message part */
  text?: string;
}

/**
 * Content structure within ADK event
 */
export interface ADKContent {
  /** Array of content parts */
  parts: ADKContentPart[];
  /** Role of the content author */
  role: 'model' | 'user' | string;
}

/**
 * ADK event structure returned from the /run endpoint
 */
export interface ADKEvent {
  /** Unique identifier for the event */
  id: string;
  /** ISO8601 timestamp of the event */
  timestamp: string;
  /** Author of the event (e.g., "model" for AI responses) */
  author: string;
  /** Optional content of the event */
  content?: ADKContent;
}

/**
 * Array of ADK events returned from the API
 */
export type ADKResponse = ADKEvent[];

/**
 * Error details for API responses
 */
export interface ApiError {
  /** User-friendly error message */
  message: string;
  /** HTTP status code if available */
  statusCode?: number;
  /** Raw error body from the server */
  rawBody?: string;
}

/**
 * Result structure for plan generation
 */
export interface GeneratePlanResult {
  /** Whether the request was successful */
  success: boolean;
  /** Extracted plan text content */
  planText?: string;
  /** Raw ADK response for debugging */
  rawResponse?: ADKResponse;
  /** Error details if request failed */
  error?: ApiError;
}
