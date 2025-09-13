import { useEffect, useRef, useState } from 'react';

// Custom hook for intersection observer - useful for lazy loading large group lists
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        // Once intersected, remember it (useful for lazy loading)
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '50px', // Load 50px before element comes into view
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected
  };
}

// Hook specifically for lazy loading table rows in large datasets
export function useLazyTableRows(data, itemsPerPage = 20) {
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay to prevent UI blocking
    setTimeout(() => {
      setVisibleItems(prev => Math.min(prev + itemsPerPage, data.length));
      setIsLoadingMore(false);
    }, 100);
  };

  const visibleData = data.slice(0, visibleItems);
  const hasMore = visibleItems < data.length;

  return {
    visibleData,
    hasMore,
    isLoadingMore,
    loadMore,
    totalItems: data.length,
    visibleCount: visibleItems
  };
}