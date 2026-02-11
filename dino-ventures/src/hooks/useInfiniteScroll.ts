import { useEffect, useRef, useState } from 'react';

export const useInfiniteScroll = (callback: () => void) => {
  const [isFetching, setIsFetching] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If the loader is visible AND we aren't already loading
        if (entries[0].isIntersecting && !isFetching) {
          setIsFetching(true);
          callback(); // Trigger the load immediately
        }
      },
      { threshold: 0.1 } 
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isFetching, callback]); // Re-bind when fetching state changes

  useEffect(() => {
    if (isFetching) {
      // FORCE RESET after 1 second. 
      // This is the "Brake" that stops runaway loading.
      const timeout = setTimeout(() => {
        setIsFetching(false);
      }, 1000); // 1 second cooldown
      
      return () => clearTimeout(timeout);
    }
  }, [isFetching]);

  return { isFetching, observerTarget };
};