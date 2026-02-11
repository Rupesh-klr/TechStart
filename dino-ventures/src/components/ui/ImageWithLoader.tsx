import { useState, useEffect, useId } from 'react';
import { Image } from 'lucide-react';
import { useImageScheduler } from '../../store/useImageScheduler';

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  onLoadComplete?: () => void;
}

export const ImageWithLoader = ({ 
  src, 
  alt, 
  className = "", 
  aspectRatio = "aspect-video",
  priority = false,
  onLoadComplete 
}: ImageWithLoaderProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const uniqueId = useId(); 

  // 👇 FIX: Use Selectors to prevent re-renders when the queue updates
  const requestLoad = useImageScheduler((state) => state.requestLoad);
  const releaseSlot = useImageScheduler((state) => state.releaseSlot);
  const cancelLoad = useImageScheduler((state) => state.cancelLoad);

  useEffect(() => {
    let isMounted = true;

    // Request permission
    requestLoad(uniqueId, priority, () => {
      if (isMounted) setShouldLoad(true);
    });

    // CLEANUP: If this component unmounts (user scrolls away), 
    // cancel the request so other images can load!
    return () => {
      isMounted = false;
      cancelLoad(uniqueId);
    };
  }, [uniqueId, priority, requestLoad, cancelLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    releaseSlot(uniqueId); 
    if (onLoadComplete) onLoadComplete();
  };

  const handleError = () => {
    setHasError(true);
    releaseSlot(uniqueId); 
    if (onLoadComplete) onLoadComplete();
  };

  return (
    <div className={`relative overflow-hidden bg-[#1a1a1a] ${aspectRatio} ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10 skeleton-shimmer" />
      )}

      {hasError && (
         <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#1a1a1a] text-gray-500">
           <Image size={32} className="mb-2 opacity-50" />
           <span className="text-xs">Failed</span>
         </div>
      )}

      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};