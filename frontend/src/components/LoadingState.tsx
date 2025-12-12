/**
 * LoadingState component displays a skeleton loading animation
 * while the AI is generating a weekend plan.
 */

/**
 * Props for the LoadingState component
 */
export interface LoadingStateProps {
  /** Optional custom message to display */
  message?: string;
}

/**
 * Loading skeleton component with pulse animation.
 * Displays "Creating your perfect weekend..." message with accessible aria attributes.
 */
export function LoadingState({ message = 'Creating your perfect weekend...' }: LoadingStateProps) {
  return (
    <div 
      className="flex flex-col gap-4 p-6" 
      aria-busy="true"
      aria-label="Loading"
    >
      <p className="text-lg text-text font-medium">{message}</p>
      
      {/* Skeleton cards with pulse animation */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="animate-pulse bg-white/50 rounded-xl p-4 space-y-3"
          >
            <div className="h-4 bg-text/20 rounded w-3/4" />
            <div className="h-3 bg-text/10 rounded w-full" />
            <div className="h-3 bg-text/10 rounded w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingState;
