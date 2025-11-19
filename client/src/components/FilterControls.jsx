import React, { memo, useCallback } from 'react';
import { Filter, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';

const FilterControls = memo(function FilterControls({ filterStatus, sortOrder, onFilterChange, onSortChange }) {
  const handleFilterChange = useCallback((status) => {
    onFilterChange(status);
  }, [onFilterChange]);

  const handleSortChange = useCallback((e) => {
    onSortChange(e.target.value);
  }, [onSortChange]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Filter Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto scrollbar-hide">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
            filterStatus === 'all' 
              ? 'bg-white text-gray-800 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 active:bg-gray-200'
          }`}
          aria-pressed={filterStatus === 'all'}
        >
          <Filter size={14} aria-hidden="true" /> All
        </button>
        <button
          onClick={() => handleFilterChange('replied')}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
            filterStatus === 'replied' 
              ? 'bg-white text-green-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 active:bg-gray-200'
          }`}
          aria-pressed={filterStatus === 'replied'}
        >
          <CheckCircle size={14} aria-hidden="true" /> Replied
        </button>
        <button
          onClick={() => handleFilterChange('unreplied')}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
            filterStatus === 'unreplied' 
              ? 'bg-white text-amber-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 active:bg-gray-200'
          }`}
          aria-pressed={filterStatus === 'unreplied'}
        >
          <XCircle size={14} aria-hidden="true" /> Unreplied
        </button>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <ArrowUpDown size={16} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
        <select
          value={sortOrder}
          onChange={handleSortChange}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 block w-full sm:w-auto p-2 transition-all duration-200 cursor-pointer"
          aria-label="Sort reviews"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>
    </div>
  );
});

FilterControls.displayName = 'FilterControls';

export default FilterControls;

