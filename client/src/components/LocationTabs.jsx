import React, { useState, useMemo, useCallback, memo } from 'react';
import { MapPin } from 'lucide-react';
import LocationCard from './LocationCard';

const LocationTabs = memo(function LocationTabs({ locations, replyText, sendingReply, onReplyTextChange, onReplySubmit }) {
  const [activeTab, setActiveTab] = useState(0);

  // Filter out locations with no reviews - memoized
  const validLocations = useMemo(() => {
    return locations.filter(loc => loc.reviews && loc.reviews.length > 0);
  }, [locations]);

  const handleTabChange = useCallback((index) => {
    setActiveTab(index);
  }, []);

  // If only one location, don't show tabs
  if (validLocations.length <= 1) {
    return validLocations.length === 1 ? (
      <LocationCard
        location={validLocations[0]}
        replyText={replyText}
        sendingReply={sendingReply}
        onReplyTextChange={onReplyTextChange}
        onReplySubmit={onReplySubmit}
      />
    ) : null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      {/* Tabs Header */}
      <div className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-hide scroll-smooth">
          {validLocations.map((location, index) => {
            const isActive = activeTab === index;
            const reviewCount = location.reviews?.length || 0;

            return (
              <button
                key={`${location.locationId || index}`}
                onClick={() => handleTabChange(index)}
                className={`
                  px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all duration-200
                  flex items-center gap-2 whitespace-nowrap
                  border-b-2 min-w-fit
                  ${isActive
                    ? 'border-gray-600 text-gray-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-selected={isActive}
                role="tab"
              >
                <MapPin size={14} className={isActive ? 'text-gray-600' : 'text-gray-400'} aria-hidden="true" />
                <span className="truncate max-w-[150px] sm:max-w-none">{location.locationName}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
                    ${isActive
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {reviewCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with smooth transition */}
      <div className="relative min-h-[400px]">
        {validLocations.map((location, index) => (
          <div
            key={`${location.locationId || index}`}
            className={`transition-all duration-300 ${
              activeTab === index 
                ? 'opacity-100 block animate-in fade-in slide-in-from-right-4' 
                : 'opacity-0 hidden'
            }`}
            role="tabpanel"
            aria-hidden={activeTab !== index}
          >
            <LocationCard
              location={location}
              replyText={replyText}
              sendingReply={sendingReply}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
              showHeader={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

LocationTabs.displayName = 'LocationTabs';

export default LocationTabs;

