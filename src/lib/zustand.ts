import { create } from 'zustand';

export type RGBA = [number, number, number, number];

type ColorStop = {
  color: RGBA;
  offset: number;
};

type ColorStore = {
  colors: ColorStop[];
  addColor: (color: RGBA, offset: number) => void;
  updateColor: (index: number, newColor: RGBA) => void;
  updateOffset: (index: number, newOffset: number) => void;
  removeColor: (index: number) => void;
};

export const useColorStore = create<ColorStore>((set) => ({
  colors: [
    { color: [24, 0, 239, 1], offset: 0 },
    { color: [74, 82, 188, 1], offset: 50 },
    { color: [150, 150, 252, 1], offset: 100 },
  ],

  addColor: (color, offset) =>
    set((state) => ({
      colors: [...state.colors, { color, offset }],
    })),

  updateColor: (index, newColor) =>
    set((state) => {
      const updated = [...state.colors];
      updated[index] = { ...updated[index], color: newColor };
      return { colors: updated };
    }),

  updateOffset: (index, newOffset) =>
    set((state) => {
      const updated = [...state.colors];
      updated[index] = { ...updated[index], offset: newOffset };
      return { colors: updated };
    }),

  removeColor: (index) =>
    set((state) => ({
      colors: state.colors.filter((_, i) => i !== index),
    })),
}));
