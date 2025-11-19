import { useState, useMemo } from 'react';
import { RATING_MAP } from '../utils/constants';

export const useFilterAndSort = (data) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const processedData = useMemo(() => {
    return data.map(location => {
      let reviews = [...(location.reviews || [])];

      // 1. Filter by Status
      if (filterStatus === 'replied') {
        reviews = reviews.filter(r => r.reviewReply);
      } else if (filterStatus === 'unreplied') {
        reviews = reviews.filter(r => !r.reviewReply);
      }

      // 2. Sort Reviews
      reviews.sort((a, b) => {
        const dateA = new Date(a.createTime).getTime();
        const dateB = new Date(b.createTime).getTime();

        const ratingA = RATING_MAP[a.starRating] || 0;
        const ratingB = RATING_MAP[b.starRating] || 0;

        switch (sortOrder) {
          case 'newest': return dateB - dateA;
          case 'oldest': return dateA - dateB;
          case 'highest': return ratingB - ratingA;
          case 'lowest': return ratingA - ratingB;
          default: return 0;
        }
      });

      return { ...location, reviews };
    });
  }, [data, filterStatus, sortOrder]);

  const visibleReviewsCount = processedData.reduce((acc, loc) => acc + (loc.reviews?.length || 0), 0);
  const totalRawReviews = data.reduce((acc, loc) => acc + (loc.reviews?.length || 0), 0);

  return {
    filterStatus,
    sortOrder,
    processedData,
    visibleReviewsCount,
    totalRawReviews,
    setFilterStatus,
    setSortOrder
  };
};

