import { Play, Info } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { DATASET,getCachedUrl } from '../../utils/mockData';
// 👇 1. Import the new component
import { ImageWithLoader } from '../ui/ImageWithLoader';

export const HeroSection = () => {
  const playVideo = usePlayerStore((state) => state.playVideo);
  
  const category = DATASET.categories[0].category;
  const featuredVideo = DATASET.categories[0].contents[0];

  const handlePlayValues = () => {
    console.log(". CLICKED VIDEO:", featuredVideo.title); // <--- Add this
    
    // Check if the URL is correct
    console.log(". URL SENT TO PLAYER:", featuredVideo.mediaUrl);
    const cleanUrl = featuredVideo.mediaUrl.replace("youtube.com/embed/", "youtube.com/watch?v=");
    playVideo({
      id: featuredVideo.slug,
      title: featuredVideo.title,
      // url: featuredVideo.mediaUrl, // Pass the embed URL directly,
      url: cleanUrl,
      thumbnail: featuredVideo.thumbnailUrl,
      channel: category.name,
      mediaType: featuredVideo.mediaType // 👈 Pass the type
    });
  };

  return (
     // Removed aspect ratios from here, letting the loader component handle the base structure
    <div className="relative w-full rounded-xl overflow-hidden mb-8 group border border-white/5 mx-auto max-w-5xl">
      
      {/* Background Image Container */}
      {/* 👇 2. Use ImageWithLoader with specific aspect ratios for mobile/desktop */}
      <ImageWithLoader 
         src={getCachedUrl(featuredVideo.thumbnailUrl)}
         alt="Featured"
         aspectRatio="aspect-[9/16] md:aspect-video"
         className="opacity-90"
      />

      {/* Gradients and Content Overlays (Ensure z-index is higher than loader) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent z-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-20" />

      <div className="absolute bottom-0 left-0 p-4 md:p-8 w-full z-30">
         {/* ... rest of the content (Title, Buttons) remains exactly the same ... */}
        <span className="inline-block px-2 py-1 bg-purple-600/90 backdrop-blur-md text-[10px] md:text-xs font-bold rounded mb-2">
          FEATURED
        </span>
        <h1 className="text-2xl md:text-4xl font-bold mb-2 leading-tight text-white drop-shadow-md">
          {featuredVideo.title}
        </h1>
        <p className="hidden md:block text-gray-200 text-sm md:text-base mb-4 line-clamp-2 max-w-xl">
          Watch this featured AI-generated masterpiece selected just for you.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={handlePlayValues}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black text-sm md:text-base font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Play
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md text-white text-sm md:text-base font-bold rounded-full border border-white/20">
            <Info className="w-4 h-4" />
            Info
          </button>
        </div>
      </div>
    </div>
  );
};