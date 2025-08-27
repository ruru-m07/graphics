import { create } from 'zustand';

export type RGBA = [number, number, number, number];

type ColorStop = {
  id: string;
  color: RGBA;
  offset: number;
};

type ColorStore = {
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
    set((state) => ({
      colors: [...state.colors, { id: Date.now().toString(), color, offset }],
    })),

  updateColor: (id, newColor) =>
    set((state) => {
      const updated = state.colors.map((color) =>
        color.id === id ? { ...color, color: newColor } : color
      );
      return { colors: updated };
    }),

  updateOffset: (id, newOffset) =>
    set((state) => {
      const updated = state.colors.map((color) =>
        color.id === id ? { ...color, offset: newOffset } : color
      );
      return { colors: updated };
    }),

  removeColor: (id) =>
    set((state) => ({
      colors: state.colors.filter((color) => color.id !== id),
    })),
}));
