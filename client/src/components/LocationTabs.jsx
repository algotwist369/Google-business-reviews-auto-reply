import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import LocationCard from './LocationCard';

export default function LocationTabs({ locations, replyText, sendingReply, onReplyTextChange, onReplySubmit }) {
  const [activeTab, setActiveTab] = useState(0);

  // Filter out locations with no reviews
  const validLocations = locations.filter(loc => loc.reviews && loc.reviews.length > 0);

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto scrollbar-hide">
          {validLocations.map((location, index) => {
            const isActive = activeTab === index;
            const reviewCount = location.reviews?.length || 0;

            return (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`
                  px-6 py-4 text-sm font-medium transition-all duration-200
                  flex items-center gap-2 whitespace-nowrap
                  border-b-2 min-w-fit
                  ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <MapPin size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                <span>{location.locationName}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
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

      {/* Tab Content */}
      <div className="relative">
        {validLocations.map((location, index) => (
          <div
            key={index}
            className={activeTab === index ? 'block' : 'hidden'}
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
}

