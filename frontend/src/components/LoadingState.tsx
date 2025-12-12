/**
 * LoadingState Component
 * 
 * A React functional component that displays a loading skeleton animation
 * during API requests while the AI is generating a weekend plan.
 * 
 * Features:
 * - Pulse animation skeleton cards mimicking expected plan output structure
 * - Displays "Creating your perfect weekend..." message
 * - Implements aria-busy="true" for screen reader accessibility
 * - Uses Tailwind CSS animate-pulse utility for visual feedback
 * 
 * @module components/LoadingState
 */

/**
 * LoadingState component displays a skeleton loading animation
 * while the AI is generating a weekend plan.
 * 
 * This is a pure presentational component with no required props.
 * It renders multiple skeleton cards that simulate the structure
 * of the expected plan output to provide visual feedback during loading.
 * 
 * Accessibility features:
 * - aria-busy="true" indicates content is loading
 * - role="status" for loading indicator semantics
 * - aria-label provides context for screen readers
 * 
 * @returns {JSX.Element} The loading state skeleton UI
 * 
 * @example
 * ```tsx
 * // Display loading state while fetching data
 * {isLoading && <LoadingState />}
 * ```
 */
export function LoadingState(): JSX.Element {
  return (
    <div
      className="rounded-xl p-6"
      aria-busy="true"
      role="status"
      aria-label="Loading weekend plan"
    >
      {/* Loading message text centered with design system colors */}
      <p className="text-lg text-[#3D405B] text-center mb-6 font-medium">
        Creating your perfect weekend...
      </p>

      {/* Skeleton cards container with vertical spacing */}
      <div className="space-y-4">
        {/* Skeleton Card 1 - Activity placeholder */}
        <div className="bg-white rounded-xl p-6 mb-4">
          {/* Header skeleton - narrow width for title appearance */}
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
          {/* Content line 1 - full width for description */}
          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
          {/* Content line 2 - slightly shorter */}
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2 animate-pulse" />
          {/* Content line 3 - shortest for variation */}
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>

        {/* Skeleton Card 2 - Activity placeholder */}
        <div className="bg-white rounded-xl p-6 mb-4">
          {/* Header skeleton */}
          <div className="h-6 bg-gray-200 rounded w-2/5 mb-4 animate-pulse" />
          {/* Content line 1 */}
          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
          {/* Content line 2 */}
          <div className="h-4 bg-gray-200 rounded w-4/5 mb-2 animate-pulse" />
          {/* Content line 3 */}
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Skeleton Card 3 - Activity placeholder */}
        <div className="bg-white rounded-xl p-6 mb-4">
          {/* Header skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
          {/* Content line 1 */}
          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
          {/* Content line 2 */}
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
          {/* Content line 3 */}
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
        </div>

        {/* Skeleton Card 4 - Additional activity placeholder for variation */}
        <div className="bg-white rounded-xl p-6">
          {/* Header skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
          {/* Content line 1 */}
          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
          {/* Content line 2 */}
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Default export of the LoadingState component.
 * Import as: import LoadingState from './components/LoadingState';
 */
export default LoadingState;
