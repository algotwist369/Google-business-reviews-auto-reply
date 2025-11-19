import React from 'react';
import { MapPin } from 'lucide-react';
import ReviewItem from './ReviewItem';

export default function LocationCard({ location, replyText, sendingReply, onReplyTextChange, onReplySubmit, showHeader = true }) {
  if (!location.reviews || location.reviews.length === 0) {
    return null;
  }

  // If showHeader is false, we're inside tabs - don't wrap in card
  if (!showHeader) {
    return (
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {location.reviews.map((review) => (
          <ReviewItem
            key={review.reviewId}
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Location Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-gray-400" />
          <h2 className="font-semibold text-lg text-gray-800">{location.locationName}</h2>
        </div>
        <span className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full font-medium">
          {location.reviews.length} shown
        </span>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {location.reviews.map((review) => (
          <ReviewItem
            key={review.reviewId}
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
}

