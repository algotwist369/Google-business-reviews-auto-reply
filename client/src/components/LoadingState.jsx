import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <RefreshCw className="animate-spin mb-3 text-blue-600" size={32} />
      <p>Fetching all reviews from Google...</p>
      <p className="text-sm text-gray-400 mt-2">This might take a moment if you have many reviews.</p>
    </div>
  );
}

