import { useCallback, useEffect, useRef, useState } from 'react';
import { useColorStore } from './lib/zustand';

type Point = { x: number; y: number };

type InteractiveLineProps = {
  start: Point;
  end: Point;
  setStart: React.Dispatch<React.SetStateAction<Point>>;
  setEnd: React.Dispatch<React.SetStateAction<Point>>;
};

export default function InteractiveLine({
  start: startPoint,
  setStart: setStartPoint,
  end: endPoint,
  setEnd: setEndPoint,
}: InteractiveLineProps) {
  const [isDragging, setIsDragging] = useState<'start' | 'end' | string | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { colors, updateOffset } = useColorStore();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, point: 'start' | 'end') => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const currentPoint = point === 'start' ? startPoint : endPoint;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setDragOffset({ x: mouseX - currentPoint.x, y: mouseY - currentPoint.y });
      setIsDragging(point);
    },
    [startPoint, endPoint]
  );

  useEffect(() => {
    if (isDragging === null) {
      return;
    }

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    const denom = lineLength * lineLength || 1; // ? avoid division-by-zero when lineLength

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX - rect.left - dragOffset.x;
      const mouseY = e.clientY - rect.top - dragOffset.y;

      if (isDragging === 'start') {
        setStartPoint({ x: mouseX, y: mouseY });
      } else if (isDragging === 'end') {
        setEndPoint({ x: mouseX, y: mouseY });
      } else if (typeof isDragging === 'string') {
        // dragging a mid color stop
        const relX = e.clientX - rect.left - startPoint.x;
        const relY = e.clientY - rect.top - startPoint.y;

        // project mouse onto line
        const dot = (relX * dx + relY * dy) / denom;
        const clampedT = Math.max(0, Math.min(1, dot));

        updateOffset(isDragging, clampedT * 100);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      setDragOffset({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    dragOffset,
    setStartPoint,
    setEndPoint,
    startPoint,
    endPoint,
    updateOffset,
  ]);

  return (
    <svg
      className="absolute inset-0 h-full w-full overflow-visible"
      ref={svgRef}
    >
      {/* Main line */}
      <line
        className="cursor-crosshair"
        opacity="0.8"
        stroke="#ffffff"
        strokeWidth="2"
        x1={startPoint.x}
        x2={endPoint.x}
        y1={startPoint.y}
        y2={endPoint.y}
      />

      {/* Start point */}
      <g
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleMouseDown(e, 'start')}
      >
        <circle
          cx={startPoint.x}
          cy={startPoint.y}
          fill="#ffffff"
          r="8"
          stroke="#ffffff"
          strokeWidth="2"
        />
      </g>

      {/* End point */}
      <g
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleMouseDown(e, 'end')}
      >
        <circle
          cx={endPoint.x}
          cy={endPoint.y}
          fill="#ffffff"
          r="8"
          stroke="#ffffff"
          strokeWidth="2"
        />
      </g>

      {/* Color stops (draggable along line only) */}
      {colors.map((color) => {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const t = (color.offset ?? 0) / 100;
        const x = startPoint.x + dx * t;
        const y = startPoint.y + dy * t;

        return (
          <g
            className="cursor-grab active:cursor-grabbing"
            key={color.id}
            onMouseDown={(e) => {
              e.preventDefault();
              // Only start drag if none is active
              if (isDragging !== color.id) {
                setIsDragging(color.id);
              }
            }}
            style={{
              zIndex: isDragging === color.id ? 1000 : 'auto',
              pointerEvents:
                isDragging === null || isDragging === color.id
                  ? 'auto'
                  : 'none',
            }}
          >
            <circle
              cx={x}
              cy={y}
              fill={`rgba(${color.color[0]}, ${color.color[1]}, ${color.color[2]}, ${color.color[3]})`}
              r={isDragging === color.id ? '9' : '8'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
}
