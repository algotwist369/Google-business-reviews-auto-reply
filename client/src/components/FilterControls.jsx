import React, { memo, useCallback, useMemo } from 'react';
import { Filter, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';

const FILTER_BUTTONS = [
  {
    key: 'all',
    label: 'All',
    icon: Filter,
    activeClass: 'bg-white text-gray-800 shadow-sm'
  },
  {
    key: 'replied',
    label: 'Replied',
    icon: CheckCircle,
    activeClass: 'bg-white text-green-600 shadow-sm'
  },
  {
    key: 'unreplied',
    label: 'Unreplied',
    icon: XCircle,
    activeClass: 'bg-white text-amber-600 shadow-sm'
  }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' }
];

const baseButtonClass =
  'px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0';
const inactiveButtonClass = 'text-gray-500 hover:text-gray-700 active:bg-gray-200';

const FilterControls = memo(function FilterControls({ filterStatus, sortOrder, onFilterChange, onSortChange }) {
  const sortOptions = useMemo(() => SORT_OPTIONS, []);

  const handleFilterClick = useCallback(
    (event) => {
      const status = event.currentTarget.dataset.status;
      if (!status || status === filterStatus) return;
      onFilterChange(status);
    },
    [filterStatus, onFilterChange]
  );

  const handleSortChange = useCallback((e) => {
    onSortChange(e.target.value);
  }, [onSortChange]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Filter Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto scrollbar-hide">
        {FILTER_BUTTONS.map((button) => {
          const Icon = button.icon;
          const isActive = filterStatus === button.key;
          return (
            <button
              key={button.key}
              data-status={button.key}
              onClick={handleFilterClick}
              className={`${baseButtonClass} ${isActive ? button.activeClass : inactiveButtonClass}`}
              aria-pressed={isActive}
            >
              <Icon size={14} aria-hidden="true" /> {button.label}
            </button>
          );
        })}
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
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

FilterControls.displayName = 'FilterControls';

export default FilterControls;

