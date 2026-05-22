import { create } from 'zustand';
import type { Capture } from '../lib/database';

interface CaptureStore {
  captures: Capture[];
  setCaptures: (captures: Capture[]) => void;
  addCapture: (capture: Capture) => void;
  updateCapture: (id: string, fields: Partial<Capture>) => void;
  removeCapture: (id: string) => void;
}

export const useCaptureStore = create<CaptureStore>((set) => ({
  captures: [],
  setCaptures: (captures) => set({ captures }),
  addCapture: (capture) =>
    set((state) => ({ captures: [capture, ...state.captures] })),
  updateCapture: (id, fields) =>
    set((state) => ({
      captures: state.captures.map((c) => (c.id === id ? { ...c, ...fields } : c)),
    })),
  removeCapture: (id) =>
    set((state) => ({ captures: state.captures.filter((c) => c.id !== id) })),
}));
