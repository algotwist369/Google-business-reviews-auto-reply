import React, { memo } from 'react';
import { MessageSquare, LogOut } from 'lucide-react';

const Header = memo(function Header({ totalReviews, onLogout }) {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-30 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-gray-600 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
          <span className="font-bold text-lg sm:text-xl text-gray-800">ReviewDash</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 uppercase font-bold">Total Reviews</p>
            <p className="text-sm font-bold text-gray-800">{totalReviews}</p>
          </div>
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-red-600 active:text-red-700 flex items-center gap-1 text-sm font-medium transition-colors duration-200 px-2 py-1 rounded-md hover:bg-red-50"
            aria-label="Logout"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;

