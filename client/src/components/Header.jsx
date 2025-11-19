import React from 'react';
import { MessageSquare, LogOut } from 'lucide-react';

export default function Header({ totalReviews, onLogout }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-blue-600" />
          <span className="font-bold text-xl text-gray-800">ReviewDash</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 uppercase font-bold">Total Reviews</p>
            <p className="text-sm font-bold text-gray-800">{totalReviews}</p>
          </div>
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}

