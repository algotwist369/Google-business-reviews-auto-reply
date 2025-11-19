import React, { memo, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import ReviewItem from './ReviewItem';

const LocationCard = memo(function LocationCard({ location, replyText, sendingReply, onReplyTextChange, onReplySubmit, showHeader = true }) {
  const reviews = useMemo(() => location.reviews || [], [location.reviews]);
  
  if (reviews.length === 0) {
    return null;
  }

  // If showHeader is false, we're inside tabs - don't wrap in card
  if (!showHeader) {
    return (
      <div className="divide-y divide-gray-100 max-h-[70vh] sm:max-h-[600px] overflow-y-auto scroll-smooth">
        {reviews.map((review) => (
          <ReviewItem
            key={review.reviewId || review.name}
            review={review}
            replyText={replyText}
            sendingReply={sendingReply}
            onReplyTextChange={onReplyTextChange}
            onReplySubmit={onReplySubmit}
          />
        ))}
      </div>
    );
  }

  // Full card view with header (single location)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      {/* Location Header */}
      <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-gray-50/95">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={18} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
          <h2 className="font-semibold text-base sm:text-lg text-gray-800 truncate">
            {location.locationName}
          </h2>
        </div>
        <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 sm:px-3 py-1 rounded-full font-medium flex-shrink-0 ml-2">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-100 max-h-[70vh] sm:max-h-[600px] overflow-y-auto scroll-smooth">
        {reviews.map((review) => (
          <ReviewItem
            key={review.reviewId || review.name}
            review={review}
            replyText={replyText}
            sendingReply={sendingReply}
            onReplyTextChange={onReplyTextChange}
            onReplySubmit={onReplySubmit}
          />
        ))}
      </div>
    </div>
  );
});

LocationCard.displayName = 'LocationCard';

export default LocationCard;

