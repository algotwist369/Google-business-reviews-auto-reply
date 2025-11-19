import React from 'react';
import { Filter, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';

export default function FilterControls({ filterStatus, sortOrder, onFilterChange, onSortChange }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      {/* Filter Buttons */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${filterStatus === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Filter size={14} /> All
        </button>
        <button
          onClick={() => onFilterChange('replied')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${filterStatus === 'replied' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CheckCircle size={14} /> Replied
        </button>
        <button
          onClick={() => onFilterChange('unreplied')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${filterStatus === 'unreplied' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <XCircle size={14} /> Unreplied
        </button>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <ArrowUpDown size={16} className="text-gray-400" />
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>
    </div>
  );
}

