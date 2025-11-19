import React from 'react';
import { Star, Send } from 'lucide-react';
import { RATING_MAP } from '../utils/constants';

export default function ReviewItem({ review, replyText, sendingReply, onReplyTextChange, onReplySubmit }) {
  const rating = RATING_MAP[review.starRating] || 0;
  const hasReply = !!review.reviewReply;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors group">
      <div className="flex items-start gap-4">
        <img
          src={review.reviewer.profilePhotoUrl || 'https://via.placeholder.com/40'}
          alt="User"
          className="w-10 h-10 rounded-full border border-gray-200"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900">{review.reviewer.displayName}</h3>
            <div className="flex items-center gap-2">
              {hasReply ? (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Replied</span>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">Unreplied</span>
              )}
              <span className="text-xs text-gray-400">
                {review.createTime ? new Date(review.createTime).toLocaleDateString() : ''}
              </span>
            </div>
          </div>

          <div className="flex text-yellow-400 mb-2">
            {[...Array(5)].map((_, s) => (
              <Star
                key={s}
                size={14}
                fill={s < rating ? 'currentColor' : 'none'}
                className={s < rating ? 'text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>

          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            {review.comment || <span className="italic text-gray-400">No text provided</span>}
          </p>

          {/* Existing Reply */}
          {hasReply && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-2 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-lg"></div>
              <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wide">Your Reply</p>
              <p className="text-sm text-gray-800">{review.reviewReply.comment}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.reviewReply.updateTime).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Reply Input */}
          {!hasReply && (
            <div className="flex gap-2 mt-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <input
                type="text"
                placeholder="Write a reply..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={replyText[review.name] || ''}
                onChange={(e) => onReplyTextChange(review.name, e.target.value)}
              />
              <button
                onClick={() => onReplySubmit(review.name)}
                disabled={sendingReply === review.name || !replyText[review.name]}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                {sendingReply === review.name ? '...' : <Send size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

