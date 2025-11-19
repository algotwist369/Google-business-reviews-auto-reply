import React, { memo } from 'react';
import { Filter } from 'lucide-react';

const EmptyState = memo(function EmptyState({ onClearFilters }) {
  return (
    <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
        <Filter className="text-gray-400 w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
      <p className="text-sm sm:text-base text-gray-500 px-4 mb-4">No reviews match your current filter settings.</p>
      <button
        onClick={onClearFilters}
        className="text-gray-600 hover:text-gray-700 active:text-gray-800 text-sm font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-50"
        aria-label="Clear all filters"
      >
        Clear Filters
      </button>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;

