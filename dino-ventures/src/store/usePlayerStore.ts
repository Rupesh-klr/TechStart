import { create } from 'zustand';

interface VideoState {
  isPlaying: boolean;
  activeVideo: {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    channel: string;
    mediaType: "YOUTUBE" | "VIDEO"; 
  } | null;
  playVideo: (video: any) => void;
  closeVideo: () => void;
}

export const usePlayerStore = create<VideoState>((set) => ({
  isPlaying: false,
  activeVideo: null,
  playVideo: (video) => set({ isPlaying: true, activeVideo: video }),
  closeVideo: () => set({ isPlaying: false, activeVideo: null }),
}));