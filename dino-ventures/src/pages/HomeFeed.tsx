import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { DATASET, type VideoContent } from '../utils/mockData';
import { HeroSection } from '../components/home/HeroSection';
import { CategoryRow } from '../components/home/CategoryRow';

export const HomeFeed = () => {
  const playVideo = usePlayerStore((state) => state.playVideo);
  
  // We start with 1 allowed row (Index 0). 
  // As row 0 loads, it will unlock row 1, etc.
  const [visibleRowIndex, setVisibleRowIndex] = useState(0);

  const handlePlay = (video: VideoContent, categoryName: string) => {
    console.log("1. CLICKED VIDEO:", video.title); // <--- Add this
    
    // Check if the URL is correct
    console.log("2. URL SENT TO PLAYER:", video.mediaUrl);
    const cleanUrl = video.mediaUrl.replace("youtube.com/embed/", "youtube.com/watch?v=");
    playVideo({
      id: video.slug,
      title: video.title,
      // url: video.mediaUrl,
      url: cleanUrl,
      thumbnail: video.thumbnailUrl,
      channel: categoryName,
      mediaType: video.mediaType // 👈 Pass the type (YOUTUBE)
    });
  };

  const handleRowReady = (index: number) => {
    // If Row 0 says it's ready, we ensure Row 1 is visible
    if (index >= visibleRowIndex) {
      setVisibleRowIndex(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <HeroSection />

      {DATASET.categories.map((cat, index) => (
        <CategoryRow 
          key={cat.category.slug}
          categoryData={cat}
          // The magic logic: Only allow loading if this row is <= the visible index
          isAllowedToLoad={index <= visibleRowIndex}
          onRowReady={() => handleRowReady(index)}
          onPlay={handlePlay}
        />
      ))}
      
      {/* Loading Indicator for bottom of feed */}
      {visibleRowIndex < DATASET.categories.length - 1 && (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};