import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { ImageWithLoader } from '../ui/ImageWithLoader';
import { type VideoContent, type Category } from '../../utils/mockData';
import { getCachedUrl } from '../../utils/mockData';

interface CategoryRowProps {
  categoryData: Category;
  isAllowedToLoad: boolean; // Controls if we fetch images or wait
  onRowReady: () => void;   // Tells parent to load next row
  onPlay: (video: VideoContent, categoryName: string) => void;
}

export const CategoryRow = ({ categoryData, isAllowedToLoad, onRowReady, onPlay }: CategoryRowProps) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const hasTriggeredNext = useRef(false);
//   const threshold = Math.ceil(categoryData.contents.length * 0.7);
  
  // Optimization: We don't wait for 100% of images, just 70%.
  // This prevents one huge/broken image from blocking the entire app.
  const threshold = 3;// Math.ceil(categoryData.contents.length * 0.7);

  useEffect(() => {
    if (loadedCount >= threshold && !hasTriggeredNext.current) {
      hasTriggeredNext.current = true;
      onRowReady();
    }
  }, [loadedCount, threshold, onRowReady]);

  // If this row isn't allowed to load yet, we render a placeholder skeleton block
  // This keeps the layout stable but saves bandwidth.
  if (!isAllowedToLoad) {
    return (
      <section className="space-y-4 px-4 opacity-50 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1a1a1a]" />
          <div className="h-8 w-48 bg-[#1a1a1a] rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
             <div key={i} className="aspect-video bg-[#1a1a1a] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden">
             <ImageWithLoader 
               src={getCachedUrl(categoryData.category.iconUrl)} 
               alt={categoryData.category.name} 
               aspectRatio="aspect-square" 
               className="bg-white/10 p-1"
               // Also mark icon as high priority so it loads with the first batch
               priority={true}
             />
        </div>
        <h2 className="text-2xl font-bold text-white">{categoryData.category.name}</h2>
      </div>

      {/* Videos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categoryData.contents.map((video, index) => (
          <div 
            key={video.slug}
            onClick={() => onPlay(video, categoryData.category.name)}
            className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
            // className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-purple-500/50 transition-all duration-300"
          >
            {/* THUMBNAIL CONTAINER */}
            <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10 group-hover:border-purple-500/50 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/20">
              
              <ImageWithLoader 
                src={getCachedUrl(video.thumbnailUrl)}
                alt={video.title}
                priority={index < 3} 
                onLoadComplete={() => setLoadedCount(prev => prev + 1)}
                className="group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* OVERLAY: Play Icon (Centers on Hover) */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 border border-white/30">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>

              {/* BADGE: Category (Top Left) */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wider">
                  {categoryData.category.name}
                </span>
              </div>

              {/* BADGE: Duration (Bottom Right) */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded-md flex items-center gap-1">
                {/* <Clock className="w-3 h-3 text-gray-400" /> */}
                {/* Mocking duration if not in data, usually "10:05" */}
                <span className="text-xs font-medium text-white">04:20</span>
              </div>
            </div>

            {/* INFO AREA */}
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                {categoryData.category.name} • 2 days ago
              </p>
            </div>
          {/* </div> */}
            {/* <ImageWithLoader 
              src={getCachedUrl(video.thumbnailUrl)}
              alt={video.title}
              // 🚦 THE MAGIC:
              // If it's one of the first 3 images, give it HIGH PRIORITY.
              priority={index < 3} 
              onLoadComplete={() => setLoadedCount(prev => prev + 1)}
            //   onLoadComplete={() => setLoadedCount(prev => prev + 1)}
            />
            
            <div className="absolute inset-0 z-30 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-6 h-6 text-white fill-current" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-8 z-30">
              <h3 className="font-bold text-white text-sm line-clamp-1">{video.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{categoryData.category.name}</p>
            </div> */}
          </div>
        ))}
      </div>
    </section>
  );
};