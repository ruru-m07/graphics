import { create } from 'zustand';

export type RGBA = [number, number, number, number];

export type ColorStop = {
  id: string;
  color: RGBA;
  offset: number;
};

export type ColorStore = {
  colors: ColorStop[];
  addColor: (color: RGBA, offset: number) => void;
  updateColor: (id: string, newColor: RGBA) => void;
  updateOffset: (id: string, newOffset: number) => void;
  removeColor: (id: string) => void;
};

export const useColorStore = create<ColorStore>((set) => ({
  colors: [
    { id: '1', color: [24, 0, 239, 1], offset: 0 },
    { id: '2', color: [74, 82, 188, 1], offset: 50 },
    { id: '3', color: [150, 150, 252, 1], offset: 100 },
  ],

  addColor: (color, offset) =>
    set((state) => {
      // ? Clamp offset into [0, 100]
      const clamped = Math.max(0, Math.min(100, offset));

      // ! Use a stable UUID if available, otherwise fall back to timestamp+random
      const id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const colors = [...state.colors, { id, color, offset: clamped }].sort(
        (a, b) => a.offset - b.offset
      );
      return { colors };
    }),

  updateColor: (id, newColor) =>
    set((state) => {
      const updated = state.colors.map((color) =>
        color.id === id ? { ...color, color: newColor } : color
      );
      return { colors: updated };
    }),

  updateOffset: (id, newOffset) =>
    set((state) => {
      const clamped = Math.max(0, Math.min(100, newOffset));

      const updated = state.colors.map((color) =>
        color.id === id ? { ...color, offset: clamped } : color
      );
      return { colors: updated };
    }),

  removeColor: (id) =>
    set((state) => ({
      colors: state.colors.filter((color) => color.id !== id),
    })),
}));
