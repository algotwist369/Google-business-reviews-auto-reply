import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingState = memo(function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 animate-in fade-in duration-300">
      <RefreshCw className="animate-spin mb-3 text-gray-600 w-8 h-8 sm:w-10 sm:h-10" aria-label="Loading" />
      <p className="text-sm sm:text-base text-gray-500">Fetching all reviews from Google...</p>
      <p className="text-xs sm:text-sm text-gray-400 mt-2 px-4 text-center">This might take a moment if you have many reviews.</p>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

export default LoadingState;

