import React from 'react';
import { Filter } from 'lucide-react';

export default function EmptyState({ onClearFilters }) {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <Filter className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
      <p className="text-gray-500">No reviews match your current filter settings.</p>
      <button
        onClick={onClearFilters}
        className="mt-4 text-blue-600 text-sm font-medium hover:underline"
      >
        Clear Filters
      </button>
    </div>
  );
}

