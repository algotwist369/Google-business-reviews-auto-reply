import React, { memo, useMemo, useCallback } from 'react';
import { Star, Send, Sparkles } from 'lucide-react';
import { RATING_MAP } from '../utils/constants';

const DEFAULT_AVATAR = 'https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png';
const EMPTY_REPLY_TEXT = Object.freeze({});
const noop = () => {};

const normalizePhotoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

const ReviewItem = memo(function ReviewItem({
  review,
  replyText = EMPTY_REPLY_TEXT,
  sendingReply = null,
  generatingReply = null,
  onReplyTextChange = noop,
  onReplySubmit = noop,
  onGenerateReply = noop,
  readOnly = false,
  showAutoReplyBadge = false
}) {
  const reviewName = review.name;
  const reviewComment = review.comment;
  const reviewReply = review.reviewReply;
  const reviewer = review.reviewer;

  const rating = useMemo(() => RATING_MAP[review.starRating] || 0, [review.starRating]);
  const hasReply = useMemo(() => !!reviewReply, [reviewReply]);
  const currentReplyText = useMemo(() => replyText[reviewName] || '', [replyText, reviewName]);
  const isSending = useMemo(() => sendingReply === reviewName, [sendingReply, reviewName]);
  const formattedDate = useMemo(() => {
    return review.createTime ? new Date(review.createTime).toLocaleDateString() : '';
  }, [review.createTime]);
  const replyDate = useMemo(() => {
    return reviewReply?.updateTime
      ? new Date(reviewReply.updateTime).toLocaleDateString()
      : '';
  }, [reviewReply]);

  const profilePhotoUrl = useMemo(() => {
    const rawUrl = reviewer?.profilePhotoUrl || review.reviewerPhoto;
    return normalizePhotoUrl(rawUrl) || DEFAULT_AVATAR;
  }, [reviewer?.profilePhotoUrl, review.reviewerPhoto]);

  const handleInputChange = useCallback(
    (e) => {
      if (readOnly) return;
      onReplyTextChange(reviewName, e.target.value);
    },
    [reviewName, onReplyTextChange, readOnly]
  );

  const handleSubmit = useCallback(() => {
    if (readOnly) return;
    onReplySubmit(reviewName);
  }, [reviewName, onReplySubmit, readOnly]);

  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, s) => (
      <Star
        key={s}
        size={14}
        fill={s < rating ? 'currentColor' : 'none'}
        className={s < rating ? 'text-yellow-400' : 'text-gray-300'}
        aria-hidden="true"
      />
    ));
  }, [rating]);
  const isGenerating = useMemo(() => generatingReply === reviewName, [generatingReply, reviewName]);

  const generationPayload = useMemo(() => {
    return {
      name: reviewName,
      comment: reviewComment || 'Customer left only a rating.',
      ratingValue: review.ratingValue ?? rating,
      reviewerName: reviewer?.displayName,
      locationName: review.locationName
    };
  }, [reviewComment, review.locationName, review.ratingValue, reviewName, reviewer?.displayName, rating]);

  const handleGenerate = useCallback(() => {
    if (readOnly) return;
    onGenerateReply(generationPayload);
  }, [generationPayload, onGenerateReply, readOnly]);

  return (
    <article className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors duration-200 group border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3 sm:gap-4">
        <img
          src={profilePhotoUrl}
          alt={`${review.reviewer?.displayName || 'User'}'s profile`}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-200 object-cover flex-shrink-0"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {reviewer?.displayName || 'Anonymous'}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {showAutoReplyBadge && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Rama Reply
                </span>
              )}
              {hasReply ? (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Replied
                </span>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Unreplied
                </span>
              )}
              <time className="text-xs text-gray-400 whitespace-nowrap" dateTime={review.createTime}>
                {formattedDate}
              </time>
            </div>
          </div>

          <div className="flex text-yellow-400 mb-2" role="img" aria-label={`${rating} out of 5 stars`}>
            {stars}
          </div>

          <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 break-words">
              {reviewComment || <span className="italic text-gray-400">No text provided</span>}
          </p>

          {/* Existing Reply */}
          {hasReply && review.reviewReply && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100 mb-2 relative animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-400 rounded-l-lg"></div>
              <p className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Your Reply</p>
              <p className="text-sm text-gray-800 break-words">{review.reviewReply.comment}</p>
              <time className="text-xs text-gray-400 mt-2 block" dateTime={review.reviewReply.updateTime}>
                {replyDate}
              </time>
            </div>
          )}

          {/* Reply Input */}
          {!readOnly && !hasReply && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  value={currentReplyText}
                  onChange={handleInputChange}
                  disabled={isSending}
                  aria-label="Reply to review"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isSending || !currentReplyText}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-all duration-200 min-w-[100px]"
                  aria-label="Send reply"
                >
                  {isSending ? (
                    <span className="animate-pulse">Sending...</span>
                  ) : (
                    <>
                      <Send size={14} aria-hidden="true" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isSending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Generate AI reply"
              >
                {isGenerating ? (
                  <span className="animate-pulse">Generating…</span>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-500" aria-hidden="true" />
                    <span>AI Generate</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

ReviewItem.displayName = 'ReviewItem';

export default ReviewItem;

