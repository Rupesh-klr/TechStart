import { create } from 'zustand';

type ImageTask = {
  id: string;
  isHighPriority: boolean;
  triggerLoad: () => void;
};

interface SchedulerState {
  activeDownloads: number;
  activeIds: Set<string>; // Track WHO is downloading to prevent duplicates
  queue: ImageTask[];
  
  requestLoad: (id: string, isHighPriority: boolean, triggerLoad: () => void) => void;
  releaseSlot: (id: string) => void;
  cancelLoad: (id: string) => void; // New: Cleanup function
}

const MAX_CONCURRENCY = 3;

export const useImageScheduler = create<SchedulerState>((set, get) => ({
  activeDownloads: 0,
  activeIds: new Set(),
  queue: [],

  requestLoad: (id, isHighPriority, triggerLoad) => {
    const state = get();
    
    // Prevent duplicates (Crucial for React Strict Mode)
    if (state.activeIds.has(id)) return; 
    const isInQueue = state.queue.some(task => task.id === id);
    if (isInQueue) return;

    if (state.activeDownloads < MAX_CONCURRENCY) {
      // Start immediately
      const newActiveIds = new Set(state.activeIds);
      newActiveIds.add(id);
      
      set({ 
        activeDownloads: state.activeDownloads + 1,
        activeIds: newActiveIds
      });
      triggerLoad();
    } else {
      // Add to queue sorted by priority
      const newQueue = [...state.queue, { id, isHighPriority, triggerLoad }];
      newQueue.sort((a, b) => (a.isHighPriority === b.isHighPriority ? 0 : a.isHighPriority ? -1 : 1));
      set({ queue: newQueue });
    }
  },

  releaseSlot: (id) => {
    const state = get();
    const newActiveIds = new Set(state.activeIds);
    newActiveIds.delete(id); // Remove finished ID

    if (state.queue.length > 0) {
      // Start next in line
      const [nextTask, ...remainingQueue] = state.queue;
      newActiveIds.add(nextTask.id); // Add next ID to active

      set({ 
        queue: remainingQueue,
        activeIds: newActiveIds 
        // activeDownloads stays the same (swapping 1 for 1)
      });
      
      nextTask.triggerLoad();
    } else {
      // Just free up space
      set({ 
        activeDownloads: Math.max(0, state.activeDownloads - 1),
        activeIds: newActiveIds
      });
    }
  },

  cancelLoad: (id) => {
    const state = get();
    // If it was in the queue, just remove it
    const filteredQueue = state.queue.filter(task => task.id !== id);
    
    // If it was actively downloading, we need to free up a slot!
    if (state.activeIds.has(id)) {
        state.releaseSlot(id); // Reuse release logic to pull next item
    } else {
        set({ queue: filteredQueue });
    }
  }
}));