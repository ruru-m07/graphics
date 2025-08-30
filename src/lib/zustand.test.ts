import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useColorStore } from './zustand';

describe('useColorStore', () => {
  const initial = [
    {
      id: '1',
      color: [24, 0, 239, 1] as [number, number, number, number],
      offset: 0,
    },
    {
      id: '2',
      color: [74, 82, 188, 1] as [number, number, number, number],
      offset: 50,
    },
    {
      id: '3',
      color: [150, 150, 252, 1] as [number, number, number, number],
      offset: 100,
    },
  ];

  beforeEach(() => {
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

  it('updateColor should change color for matching id only', () => {
    const targetId = '2';
    const newColor: [number, number, number, number] = [0, 0, 0, 1];

    useColorStore.getState().updateColor(targetId, newColor);

    const { colors } = useColorStore.getState();
    expect(colors.find((c) => c.id === targetId)?.color).toEqual(newColor);
    expect(colors.find((c) => c.id === '1')?.color).toEqual(initial[0].color);
    expect(colors.find((c) => c.id === '3')?.color).toEqual(initial[2].color);
  });

  it('updateColor should no-op when id does not exist', () => {
    const before = useColorStore.getState().colors;
    useColorStore.getState().updateColor('missing', [1, 2, 3, 0.1]);
    const after = useColorStore.getState().colors;
    expect(after).toEqual(before);
    expect(after).toEqual(initial);
  });

  it('updateOffset should change offset for matching id only', () => {
    useColorStore.getState().updateOffset('1', 33);
    const { colors } = useColorStore.getState();
    expect(colors.find((c) => c.id === '1')?.offset).toBe(33);
    expect(colors.find((c) => c.id === '2')?.offset).toBe(50);
    expect(colors.find((c) => c.id === '3')?.offset).toBe(100);
  });

  it('updateOffset should not accept edge offsets (negative and >100) without validation', () => {
    useColorStore.getState().updateOffset('3', -10);
    expect(
      useColorStore.getState().colors.find((c) => c.id === '3')?.offset
    ).not.toBe(-10);

    useColorStore.getState().updateOffset('3', 250);
    expect(
      useColorStore.getState().colors.find((c) => c.id === '3')?.offset
    ).not.toBe(250);
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
    expect(colors.find((c) => c.id === '2')).toBeUndefined();
    expect(colors.map((c) => c.id)).toEqual(['1', '3']);
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
