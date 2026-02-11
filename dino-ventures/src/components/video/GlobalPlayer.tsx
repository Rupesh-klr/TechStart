import { X } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

export const GlobalPlayer = () => {
  // 1. Get the state from the store
  const { isPlaying, activeVideo, closeVideo } = usePlayerStore();

  // 2. If not playing or no video data, render nothing
  if (!isPlaying || !activeVideo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        
        {/* Close Button */}
        <button 
          onClick={closeVideo}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Video Container */}
        <div className="aspect-video w-full relative bg-black">
          
          {/* 👇 LOGIC TO HANDLE YOUTUBE VS NORMAL VIDEO */}
          {activeVideo.mediaType === 'YOUTUBE' ? (
            <iframe
              // We append autoplay=1 to ensure it starts immediately
              src={`${activeVideo.url}?autoplay=1&rel=0`} 
              title={activeVideo.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video 
              src={activeVideo.url} 
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
          )}

        </div>

        {/* Video Info Footer */}
        <div className="p-6 bg-[#121212]">
          <h2 className="text-xl font-bold text-white">{activeVideo.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-purple-400 text-xs font-bold px-2 py-0.5 bg-purple-400/10 rounded">
              {activeVideo.mediaType}
            </span>
            <p className="text-gray-400 text-sm">{activeVideo.channel}</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};