import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useReviews = (token, onUnauthorized) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState(null);

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchReviews = async (options = {}) => {
    if (!token) return;
    setLoading(true);
    try {
      // Use getAllReviews for backward compatibility or when no pagination needed
      const reviews = options.usePagination 
        ? await api.getReviews(token, options)
        : await api.getAllReviews(token);
      setData(reviews);
    } catch (err) {
      console.error('Error loading reviews', err);
      if (err.response?.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewName) => {
    const comment = replyText[reviewName];
    if (!comment) return;

    setSendingReply(reviewName);
    try {
      await api.replyToReview(token, reviewName, comment);
      alert('Reply posted!');
      setReplyText({ ...replyText, [reviewName]: '' });
      await fetchReviews();
    } catch (err) {
      console.error('Failed to reply', err);
      alert('Failed to reply.');
    } finally {
      setSendingReply(null);
    }
  };

  const updateReplyText = (reviewName, text) => {
    setReplyText({ ...replyText, [reviewName]: text });
  };

  return {
    loading,
    data,
    replyText,
    sendingReply,
    fetchReviews,
    handleReplySubmit,
    updateReplyText
  };
};

