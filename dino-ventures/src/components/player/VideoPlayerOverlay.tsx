import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, RotateCcw, RotateCw, 
  Settings, Volume2, VolumeX, Maximize 
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

export const VideoPlayerOverlay = () => {
  const { isPlaying, activeVideo, closeVideo } = usePlayerStore();
  const playerRef = useRef<ReactPlayer>(null);
  
  // Player State
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Reset state when new video opens
  useEffect(() => {
    if (activeVideo) {
      setPlaying(true);
      setPlayed(0);
      setPlaybackRate(1.0);
    }
  }, [activeVideo]);

  // 🔧 FIX: Helper to ensure ReactPlayer gets the URL it likes
  const getPlayableUrl = (url: string) => {
    if (!url) return "";
    // If it's a YouTube embed link, convert it to a watch link
    if (url.includes("youtube.com/embed/")) {
      return url.replace("youtube.com/embed/", "youtube.com/watch?v=");
    }
    return url;
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handlePlayPause = () => setPlaying(!playing);
  
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    playerRef.current?.seekTo(newPlayed);
  };
  
  const handleRewind = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10);
  const handleFastForward = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10);

  if (!activeVideo) return null;

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
        >
          {/* Close Button */}
          <button 
            onClick={closeVideo}
            className="absolute top-4 right-4 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main Player Container */}
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => { setIsHovering(false); setShowSpeedMenu(false); }}
          >
            
            {/* 📺 REACT PLAYER with Fixed URL */}
            <ReactPlayer
              ref={playerRef}
              url={getPlayableUrl(activeVideo.url)} // 👈 Using the helper here
              width="100%"
              height="100%"
              playing={playing}
              volume={volume}
              muted={muted}
              playbackRate={playbackRate}
              onProgress={(state) => {
                if (!isHovering) setPlayed(state.played);
              }}
              onDuration={setDuration}
              // Important: Disable native YouTube controls
              controls={false} 
              config={{
                youtube: { 
                  playerVars: { showinfo: 0, controls: 0, modestbranding: 1, rel: 0 } 
                }
              }}
            />

            {/* 🎮 CUSTOM CONTROLS OVERLAY */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 py-6 transition-opacity duration-300 ${isHovering || !playing ? 'opacity-100' : 'opacity-0'}`}>
              
              {/* Seek Bar */}
              <div className="relative group/slider w-full h-4 mb-4 flex items-center cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={0.999999}
                  step="any"
                  value={played}
                  onChange={handleSeekChange}
                  className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 relative" 
                    style={{ width: `${played * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover/slider:scale-100 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Button Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button onClick={handleRewind} className="text-white/80 hover:text-white transition">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  
                  <button onClick={handlePlayPause} className="text-white hover:scale-110 transition">
                    {playing ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                  </button>
                  
                  <button onClick={handleFastForward} className="text-white/80 hover:text-white transition">
                    <RotateCw className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 group/vol ml-2">
                    <button onClick={() => setMuted(!muted)} className="text-white/80 hover:text-white">
                      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input 
                      type="range" 
                      min={0} max={1} step={0.1}
                      value={muted ? 0 : volume}
                      onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                      className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <span className="text-xs text-white/70 font-mono">
                    {formatTime(played * duration)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-4 relative">
                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-12 right-0 bg-black/90 border border-white/10 rounded-lg p-2 min-w-[80px] flex flex-col gap-1 shadow-xl"
                      >
                        {[0.5, 1, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }}
                            className={`text-left px-3 py-1 text-sm rounded hover:bg-white/10 ${playbackRate === rate ? 'text-purple-400 font-bold' : 'text-white/80'}`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-1 text-white/80 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition"
                  >
                    <Settings className="w-4 h-4" />
                    {playbackRate}x
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};