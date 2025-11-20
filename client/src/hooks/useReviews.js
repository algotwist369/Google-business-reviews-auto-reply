import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { useWebSocket } from './useWebSocket';

const REVIEW_REFRESH_COOLDOWN_MS = 15000;
const REVIEW_MIN_DELAY_MS = 2000;

export const useReviews = (token, onUnauthorized) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState(null);
  const [generatingReply, setGeneratingReply] = useState(null);

  // Initialize WebSocket connection
  const { subscribe } = useWebSocket(token);

  // Track ongoing requests to prevent duplicates
  const reviewsRequestRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const scheduledRefreshTimeoutRef = useRef(null);
  const didInitialFetchRef = useRef(false);
  const prevTokenRef = useRef(null);

  const fetchReviews = useCallback(async (options = {}) => {
    if (!token) return;
    
    // Prevent duplicate simultaneous requests
    if (reviewsRequestRef.current) {
      return;
    }
    
    reviewsRequestRef.current = true;
    setLoading(true);
    try {
      // Use getAllReviews for backward compatibility or when no pagination needed
      const reviews = options.usePagination 
        ? await api.getReviews(token, options)
        : await api.getAllReviews(token);
      setData(reviews);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 && onUnauthorized) {
        onUnauthorized();
        toast.error('Your session expired. Please sign in again.');
      } else if (status === 403) {
        toast.error('Google authentication expired. Please reconnect from Profile & Billing.');
      } else if (status !== 429) {
        toast.error('Unable to load reviews. Please try again.');
      }
    } finally {
      setLoading(false);
      reviewsRequestRef.current = false;
      lastFetchTimeRef.current = Date.now();
    }
  }, [token, onUnauthorized]);

  const requestReviewsRefresh = useCallback(() => {
    if (!token) return;

    const now = Date.now();
    const elapsed = now - lastFetchTimeRef.current;

    if (elapsed >= REVIEW_REFRESH_COOLDOWN_MS && !reviewsRequestRef.current) {
      fetchReviews();
      return;
    }

    if (scheduledRefreshTimeoutRef.current) {
      return;
    }

    const delay = Math.max(REVIEW_REFRESH_COOLDOWN_MS - elapsed, REVIEW_MIN_DELAY_MS);
    scheduledRefreshTimeoutRef.current = setTimeout(() => {
      scheduledRefreshTimeoutRef.current = null;
      fetchReviews();
    }, delay);
  }, [token, fetchReviews]);

  // Initial load with guard for StrictMode double-invocation
  useEffect(() => {
    if (!token) {
      prevTokenRef.current = null;
      didInitialFetchRef.current = false;
      if (scheduledRefreshTimeoutRef.current) {
        clearTimeout(scheduledRefreshTimeoutRef.current);
        scheduledRefreshTimeoutRef.current = null;
      }
      return;
    }

    if (prevTokenRef.current !== token) {
      prevTokenRef.current = token;
      didInitialFetchRef.current = false;
    }

    if (!didInitialFetchRef.current) {
      didInitialFetchRef.current = true;
      fetchReviews();
    }
  }, [token, fetchReviews]);

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!token) return;

    // Subscribe to reviews updates (data comes in payload - no API call needed)
    const unsubscribeUpdated = subscribe('reviews:updated', (payload) => {
      if (payload.data) {
        setData(payload.data);
      }
    });

    // Subscribe to reviews refresh request (debounced)
    const unsubscribeRefresh = subscribe('reviews:refresh', () => {
      requestReviewsRefresh();
    });

    // Subscribe to review replied event (debounced)
    const unsubscribeReplied = subscribe('review:replied', (payload) => {
      // Refresh reviews when a reply is posted
      requestReviewsRefresh();
    });

    return () => {
      unsubscribeUpdated();
      unsubscribeRefresh();
      unsubscribeReplied();
    };
  }, [token, subscribe, requestReviewsRefresh]);

  // Cleanup scheduled refresh on unmount
  useEffect(() => {
    return () => {
      if (scheduledRefreshTimeoutRef.current) {
        clearTimeout(scheduledRefreshTimeoutRef.current);
      }
    };
  }, []);

  const handleReplySubmit = async (reviewName) => {
    const comment = replyText[reviewName];
    if (!comment) return;

    setSendingReply(reviewName);
    try {
      await api.replyToReview(token, reviewName, comment);
      toast.success('Reply posted!');
      setReplyText({ ...replyText, [reviewName]: '' });
      // WebSocket will automatically refresh reviews via 'review:replied' event
      // No need to manually call fetchReviews()
    } catch (err) {
      toast.error('Failed to reply. Please try again.');
    } finally {
      setSendingReply(null);
    }
  };

  const updateReplyText = (reviewName, text) => {
    setReplyText({ ...replyText, [reviewName]: text });
  };

  const handleGenerateReply = useCallback(
    async (reviewPayload = {}) => {
      if (!token || !reviewPayload.name || !reviewPayload.comment) {
        return;
      }

      if (generatingReply === reviewPayload.name) {
        return;
      }

      setGeneratingReply(reviewPayload.name);
      try {
        const response = await api.generateAiReply(token, {
          reviewName: reviewPayload.name,
          reviewText: reviewPayload.comment,
          ratingValue: reviewPayload.ratingValue,
          reviewerName: reviewPayload.reviewerName,
          locationName: reviewPayload.locationName
        });

        const suggestion = response?.data?.reply || response?.data?.data?.reply;
        if (suggestion) {
          setReplyText((prev) => ({
            ...prev,
            [reviewPayload.name]: suggestion
          }));
        }
      } catch (err) {
        if (err.response?.status === 401 && onUnauthorized) {
          onUnauthorized();
          toast.error('Your session expired. Please sign in again.');
        } else if (err.response?.status !== 429) {
          toast.error('Unable to generate AI reply right now.');
        }
      } finally {
        setGeneratingReply(null);
      }
    },
    [token, generatingReply, onUnauthorized]
  );

  return {
    loading,
    data,
    replyText,
    sendingReply,
    generatingReply,
    fetchReviews,
    handleReplySubmit,
    updateReplyText,
    handleGenerateReply
  };
};

