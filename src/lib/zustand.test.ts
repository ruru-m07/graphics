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

// ---- Tests appended by PR assistant ----
/* Test framework: Vitest (adjust to Jest if your repo uses it) */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useColorStore', () => {
  const initial = [
    { id: '1', color: [24, 0, 239, 1] as [number, number, number, number], offset: 0 },
    { id: '2', color: [74, 82, 188, 1] as [number, number, number, number], offset: 50 },
    { id: '3', color: [150, 150, 252, 1] as [number, number, number, number], offset: 100 },
  ];

  beforeEach(() => {
    // Reset zustand store between tests
    useColorStore.setState({ colors: JSON.parse(JSON.stringify(initial)) });
    vi.restoreAllMocks();
  });

  it('should initialize with three default color stops', () => {
    const { colors } = useColorStore.getState();
    expect(colors).toHaveLength(3);
    expect(colors[0]).toEqual(initial[0]);
    expect(colors[1]).toEqual(initial[1]);
    expect(colors[2]).toEqual(initial[2]);
  });

  it('addColor should append a new color with deterministic id (mocked Date.now)', () => {
    const now = 1_726_983_200_000; // Fixed timestamp
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const newColor: [number, number, number, number] = [10, 20, 30, 0.5] as any;
    useColorStore.getState().addColor(newColor, 25);

    const { colors } = useColorStore.getState();
    expect(colors).toHaveLength(4);
    const added = colors[3];
    expect(added).toEqual({ id: String(now), color: newColor, offset: 25 });
  });

  it('updateColor should change color for matching id only', () => {
    const targetId = '2';
    const newColor: [number, number, number, number] = [0, 0, 0, 1];

    useColorStore.getState().updateColor(targetId, newColor);

    const { colors } = useColorStore.getState();
    expect(colors.find(c => c.id === targetId)?.color).toEqual(newColor);
    // Others unchanged
    expect(colors.find(c => c.id === '1')?.color).toEqual(initial[0].color);
    expect(colors.find(c => c.id === '3')?.color).toEqual(initial[2].color);
  });

  it('updateColor should no-op when id does not exist', () => {
    const before = useColorStore.getState().colors;
    useColorStore.getState().updateColor('missing', [1, 2, 3, 0.1]);
    const after = useColorStore.getState().colors;
    expect(after).toEqual(before); // content equal (map returns new array but with equal items)
    // Ensure original entries unaffected
    expect(after).toEqual(initial);
  });

  it('updateOffset should change offset for matching id only', () => {
    useColorStore.getState().updateOffset('1', 33);
    const { colors } = useColorStore.getState();
    expect(colors.find(c => c.id === '1')?.offset).toBe(33);
    expect(colors.find(c => c.id === '2')?.offset).toBe(50);
    expect(colors.find(c => c.id === '3')?.offset).toBe(100);
  });

  it('updateOffset should accept edge offsets (negative and >100) without validation', () => {
    useColorStore.getState().updateOffset('3', -10);
    expect(useColorStore.getState().colors.find(c => c.id === '3')?.offset).toBe(-10);

    useColorStore.getState().updateOffset('3', 250);
    expect(useColorStore.getState().colors.find(c => c.id === '3')?.offset).toBe(250);
  });

  it('updateOffset should no-op when id does not exist', () => {
    const before = useColorStore.getState().colors;
    useColorStore.getState().updateOffset('NaN', 77);
    const after = useColorStore.getState().colors;
    expect(after).toEqual(before);
    expect(after).toEqual(initial);
  });

  it('removeColor should remove the correct color stop', () => {
    useColorStore.getState().removeColor('2');
    const { colors } = useColorStore.getState();
    expect(colors).toHaveLength(2);
    expect(colors.find(c => c.id === '2')).toBeUndefined();
    expect(colors.map(c => c.id)).toEqual(['1', '3']);
  });

  it('removeColor should no-op when id does not exist', () => {
    const before = useColorStore.getState().colors;
    useColorStore.getState().removeColor('bad-id');
    const after = useColorStore.getState().colors;
    expect(after).toEqual(before);
  });

  it('addColor should not mutate existing array reference (returns new array)', () => {
    const beforeRef = useColorStore.getState().colors;
    vi.spyOn(Date, 'now').mockReturnValue(123);
    useColorStore.getState().addColor([1, 1, 1, 1], 5);
    const afterRef = useColorStore.getState().colors;
    expect(afterRef).not.toBe(beforeRef);
  });

  it('updateColor should return a new array reference (immutability)', () => {
    const beforeRef = useColorStore.getState().colors;
    useColorStore.getState().updateColor('1', [9, 9, 9, 1]);
    const afterRef = useColorStore.getState().colors;
    expect(afterRef).not.toBe(beforeRef);
  });

  it('updateOffset should return a new array reference (immutability)', () => {
    const beforeRef = useColorStore.getState().colors;
    useColorStore.getState().updateOffset('1', 99);
    const afterRef = useColorStore.getState().colors;
    expect(afterRef).not.toBe(beforeRef);
  });

  it('removeColor should return a new array reference (immutability)', () => {
    const beforeRef = useColorStore.getState().colors;
    useColorStore.getState().removeColor('1');
    const afterRef = useColorStore.getState().colors;
    expect(afterRef).not.toBe(beforeRef);
  });
});