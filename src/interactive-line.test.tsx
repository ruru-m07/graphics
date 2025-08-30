/**
 * Test framework and libs in use:
 * - Uses the project's configured runner (Vitest or Jest) with React Testing Library.
 * - We import from "@testing-library/react" and "user-event" and rely on existing setup (e.g., jest-dom matchers if present).
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the zustand store used by InteractiveLine
// We only need colors and updateOffset; tests will control these.
vi.mock('./lib/zustand', () => {
  const colors = [
    { id: 'c1', color: [255, 0, 0, 1], offset: 25 },
    { id: 'c2', color: [0, 255, 0, 0.5], offset: 75 },
  ];
  const updateOffset = vi.fn();
  return {
    useColorStore: () => ({ colors, updateOffset }),
    // also export for direct access in assertions if desired
    __test__: { colors, updateOffset },
  };
});

// Import after mocking
import InteractiveLine from './interactive-line';
import { useColorStore as useColorStoreMock } from './lib/zustand';

// Types
type Point = { x: number; y: number };

function setup({
  start = { x: 10, y: 10 },
  end = { x: 110, y: 10 },
}: { start?: Point; end?: Point } = {}) {
  const setStart = vi.fn();
  const setEnd = vi.fn();

  const utils = render(
    <InteractiveLine
      start={start}
      end={end}
      setStart={setStart as React.Dispatch<React.SetStateAction<Point>>}
      setEnd={setEnd as React.Dispatch<React.SetStateAction<Point>>}
    />
  );

  const { container } = utils;

  // circles order:
  // [0] start handle (white), [1] end handle (white), [2..] color stop circles
  const circles = Array.from(container.querySelectorAll('circle'));

  // Ensure we control getBoundingClientRect for stable coordinates
  const svg = container.querySelector('svg') as SVGSVGElement;
  const rect = { left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200, x: 0, y: 0, toJSON: () => ({}) };
  // @ts-expect-error overriding for JSDOM
  svg.getBoundingClientRect = () => rect;

  return {
    ...utils,
    svg,
    rect,
    circles,
    startCircle: circles[0],
    endCircle: circles[1],
    colorCircles: circles.slice(2),
    setStart,
    setEnd,
  };
}

describe('InteractiveLine rendering', () => {
  it('renders main line with correct endpoints', () => {
    const start = { x: 15, y: 20 };
    const end = { x: 115, y: 80 };
    const { container } = setup({ start, end });

    const line = container.querySelector('line')!;
    expect(line).toBeTruthy();
    expect(line.getAttribute('x1')).toBe(String(start.x));
    expect(line.getAttribute('y1')).toBe(String(start.y));
    expect(line.getAttribute('x2')).toBe(String(end.x));
    expect(line.getAttribute('y2')).toBe(String(end.y));
  });

  it('renders start/end handles and color stop circles', () => {
    const { circles } = setup();
    // 2 handles + 2 color stops = 4 circles
    expect(circles.length).toBeGreaterThanOrEqual(4);
    // start/end are white
    expect(circles[0].getAttribute('fill')).toBe('#ffffff');
    expect(circles[1].getAttribute('fill')).toBe('#ffffff');
    // color stops use rgba(...)
    expect(circles[2].getAttribute('fill')).toMatch(/^rgba\(/);
  });
});

describe('Dragging endpoints', () => {
  it('drags the start handle: updates setStart with new coordinates', async () => {
    const user = userEvent.setup();
    const { startCircle, setStart, svg } = setup();

    // Mouse down exactly on the start handle: dragOffset should be (0,0)
    await user.pointer([{ keys: '[MouseLeft>]', target: startCircle }]);

    // Move to (30, 30) relative to SVG rect (left/top = 0)
    fireEvent.mouseMove(window, { clientX: 30, clientY: 30 });

    // Expect setStart to have been called with the new absolute coordinates
    expect(setStart).toHaveBeenCalledWith({ x: 30, y: 30 });

    // Mouse up ends dragging
    await user.pointer([{ keys: '[/MouseLeft]' }]);

    const callsBefore = setStart.mock.calls.length;

    // Further moves should not call setters after mouseup
    fireEvent.mouseMove(window, { clientX: 50, clientY: 50 });
    expect(setStart.mock.calls.length).toBe(callsBefore);
  });

  it('drags the end handle: respects dragOffset and updates setEnd', async () => {
    const user = userEvent.setup();
    const { endCircle, setEnd } = setup();

    // Press not exactly at the center to create a dragOffset
    // Suppose end at (110, 10). Press at (120, 20) => dragOffset = (10, 10)
    await user.pointer([{ keys: '[MouseLeft>]', target: endCircle, coords: { x: 120, y: 20 } }]);

    // Now move mouse to (160, 60).
    // New endpoint = (clientX - rect.left - dragOffset.x, clientY - rect.top - dragOffset.y) = (150, 50)
    fireEvent.mouseMove(window, { clientX: 160, clientY: 60 });

    expect(setEnd).toHaveBeenCalledWith({ x: 150, y: 50 });

    await user.pointer([{ keys: '[/MouseLeft]' }]);
  });

  it('gracefully does nothing if getBoundingClientRect returns null on mousedown', async () => {
    const user = userEvent.setup();
    const { startCircle, setStart, container } = setup();

    const svg = container.querySelector('svg') as SVGSVGElement;
    // Force rect to be null to trigger early return path
    // @ts-expect-error force null
    svg.getBoundingClientRect = () => null;

    await user.pointer([{ keys: '[MouseLeft>]', target: startCircle }]);
    fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
    expect(setStart).not.toHaveBeenCalled();
    await user.pointer([{ keys: '[/MouseLeft]' }]);
  });
});

describe('Dragging color stops along the line', () => {
  it('activates color stop drag and increases radius on active stop', async () => {
    const user = userEvent.setup();
    const { colorCircles, container } = setup();

    const firstStop = colorCircles[0];
    expect(firstStop.getAttribute('r')).toBe('8');

    // mousedown on the color stop's group <g>; the handler is on the parent <g>
    const stopGroup = firstStop.parentElement as SVGGElement;
    await user.pointer([{ keys: '[MouseLeft>]', target: stopGroup }]);

    // radius should become 9 when this stop is active
    expect(firstStop.getAttribute('r')).toBe('9');

    await user.pointer([{ keys: '[/MouseLeft]' }]);
  });

  it('updates offset proportionally when dragging within the line (horizontal)', async () => {
    const user = userEvent.setup();
    const { colorCircles } = setup();
    const { __test__ } = useColorStoreMock() as any;
    const updateOffset = __test__.updateOffset as ReturnType<typeof vi.fn>;

    updateOffset.mockClear();

    const stopGroup = colorCircles[0].parentElement as SVGGElement;

    // Start dragging this color stop
    await user.pointer([{ keys: '[MouseLeft>]', target: stopGroup }]);

    // Line from (10,10) to (110,10): length 100
    // Move mouse to clientX=60 => relX = 60 - 10 = 50 => t=0.5 => 50%
    fireEvent.mouseMove(window, { clientX: 60, clientY: 10 });

    expect(updateOffset).toHaveBeenLastCalledWith('c1', 50);

    // Move beyond end: should clamp to 100
    fireEvent.mouseMove(window, { clientX: 1000, clientY: 10 });
    expect(updateOffset).toHaveBeenLastCalledWith('c1', 100);

    // Move before start: should clamp to 0
    fireEvent.mouseMove(window, { clientX: -100, clientY: 10 });
    expect(updateOffset).toHaveBeenLastCalledWith('c1', 0);

    await user.pointer([{ keys: '[/MouseLeft]' }]);
  });

  it('updates offset correctly on non-horizontal lines (diagonal projection)', async () => {
    const user = userEvent.setup();
    // Use a 3-4-5 triangle vector: start (0,0) to end (80,60) => length 100
    const { colorCircles } = setup({ start: { x: 0, y: 0 }, end: { x: 80, y: 60 } });
    const { __test__ } = useColorStoreMock() as any;
    const updateOffset = __test__.updateOffset as ReturnType<typeof vi.fn>;

    updateOffset.mockClear();

    const stopGroup = colorCircles[1].parentElement as SVGGElement; // 'c2'

    await user.pointer([{ keys: '[MouseLeft>]', target: stopGroup }]);

    // For this line, t = ((relX*dx + relY*dy) / (len^2))
    // Choose a point at 25% along the line: (20,15) since dx=80,dy=60
    fireEvent.mouseMove(window, { clientX: 20, clientY: 15 });
    expect(updateOffset).toHaveBeenLastCalledWith('c2', 25);

    // Choose a point at 90% along the line: (72,54)
    fireEvent.mouseMove(window, { clientX: 72, clientY: 54 });
    expect(updateOffset).toHaveBeenLastCalledWith('c2', 90);

    await user.pointer([{ keys: '[/MouseLeft]' }]);
  });

  it('does nothing when rect is unavailable during drag effect', async () => {
    const user = userEvent.setup();
    const { colorCircles, container } = setup();
    const { __test__ } = useColorStoreMock() as any;
    const updateOffset = __test__.updateOffset as ReturnType<typeof vi.fn>;

    updateOffset.mockClear();

    const svg = container.querySelector('svg') as SVGSVGElement;
    const originalGetRect = svg.getBoundingClientRect;

    // Begin drag with rect available
    const stopGroup = colorCircles[0].parentElement as SVGGElement;
    await user.pointer([{ keys: '[MouseLeft>]', target: stopGroup }]);

    // Now break rect for the effect's mousemove handler path
    // @ts-expect-error force null
    svg.getBoundingClientRect = () => null;

    fireEvent.mouseMove(window, { clientX: 60, clientY: 60 });
    expect(updateOffset).not.toHaveBeenCalled();

    // Restore
    // @ts-expect-error restore
    svg.getBoundingClientRect = originalGetRect;

    await user.pointer([{ keys: '[/MouseLeft]' }]);
  });

  it('pointerEvents styling disables other stops while dragging one', async () => {
    const user = userEvent.setup();
    const { colorCircles } = setup();

    const firstStopGroup = colorCircles[0].parentElement as SVGGElement;
    const secondStopGroup = colorCircles[1].parentElement as SVGGElement;

    expect(firstStopGroup.style.pointerEvents).toBe('');  // initial: auto via null state
    expect(secondStopGroup.style.pointerEvents).toBe('');

    await user.pointer([{ keys: '[MouseLeft>]', target: firstStopGroup }]);

    // While dragging the first, others should have pointerEvents 'none'
    expect(firstStopGroup.style.pointerEvents).toBe('auto');
    expect(secondStopGroup.style.pointerEvents).toBe('none');

    await user.pointer([{ keys: '[/MouseLeft]' }]);

    // After release, back to auto
    expect(firstStopGroup.style.pointerEvents).toBe('auto'); // remains rendered as 'auto' after last state; acceptable
  });
});