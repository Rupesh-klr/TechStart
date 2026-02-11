import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { IN_DATASET ,LOADING_CONFIG, fetchVideoSegment, type VideoContent } from '../utils/mockData';
import { HeroSection } from '../components/home/HeroSection';
import { ImageWithLoader } from '../components/ui/ImageWithLoader';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// Define the shape of our list item
type VideoItem = { video: VideoContent; categoryName: string };

export const InfiniteScrollHomeFeed = () => {
  const playVideo = usePlayerStore((state) => state.playVideo);
  
  // 1. STATE: Start with an EMPTY list. We don't have 90 videos yet.
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  
  // 2. Track where we are in the "Database"
  const offsetRef = useRef(0);

  // 3. The Function to fetch Next Batch (Append Logic)
  const fetchNextBatch = async (count: number) => {
    console.log("ddddd")
    // Call our "Server"
    const response = await fetchVideoSegment(offsetRef.current, count,IN_DATASET);
    
    if (response.data.length > 0) {
      // Append new videos to the existing list
      setVideos((prev) => [...prev, ...response.data]);
      
      // Update our cursor/offset
      offsetRef.current += count;
      setHasMore(response.hasMore);
    } else {
      setHasMore(false);
    }
  };

  // 4. Initial Load (Run once on mount)
  useEffect(() => {
    const init = async () => {
      await fetchNextBatch(LOADING_CONFIG.INITIAL_VIDEO_COUNT);
      setIsLoadingInitial(false);
    };
    init();
  }, []);

  // 5. Scroll Trigger Logic
  const handleScrollTrigger = async () => {
    if (!hasMore) return;
    // Strictly load ONLY the configured amount (e.g., 1)
    await fetchNextBatch(LOADING_CONFIG.LOAD_MORE_COUNT);
  };

  // 6. Connect the Hook
  const { isFetching, observerTarget } = useInfiniteScroll(handleScrollTrigger);

  const handlePlay = (video: VideoContent, categoryName: string) => {
    const cleanUrl = video.mediaUrl.replace("youtube.com/embed/", "youtube.com/watch?v=");
    playVideo({
      id: video.slug,
      title: video.title,
      url: cleanUrl,
      thumbnail: video.thumbnailUrl,
      channel: categoryName
    });
  };

  return (
    <div className="space-y-8 pb-24">
      <HeroSection />

      <section className="px-4">
        <p className="text-xs text-gray-500 mb-4 font-mono invisible">
           Loaded: {videos.length} videos from Server
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((item, index) => (
            <div 
              key={`${item.video.slug}-${index}`}
              onClick={() => handlePlay(item.video, item.categoryName)}
              className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
            >
              <ImageWithLoader 
                src={item.video.thumbnailUrl}
                alt={item.video.title}
                priority={index < 3} 
              />
              
              <div className="absolute inset-0 z-30 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-8 z-30">
                <h3 className="font-bold text-white text-sm line-clamp-1">{item.video.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.categoryName}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Loading States */}
      {isLoadingInitial && (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoadingInitial && hasMore && (
        <div 
          ref={observerTarget} 
          className="h-32 flex flex-col items-center justify-center gap-3 opacity-80 border-t border-white/5 mt-8"
        >
           {isFetching ? (
             <>
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Fetching from server...</span>
             </>
           ) : (
             <div className="flex flex-col items-center animate-bounce">
               <span className="text-xl text-purple-500">↓</span>
               <span className="text-xs text-gray-500 font-medium mt-1">
                 Pull for next video
               </span>
             </div>
           )}
        </div>
      )}

      {!hasMore && (
        <div className="text-center py-8 text-gray-600 text-sm">
          No more videos to load.
        </div>
      )}
    </div>
  );
};