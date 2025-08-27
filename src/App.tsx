import { useEffect, useRef, useState } from 'react';
import LeftSideBar from './components/sidebar/left';
import RightSideBar from './components/sidebar/right';
import InteractiveLine from './InteractiveLine';
import { cn } from './lib/utils';
import { useColorStore } from './lib/zustand';

const SIZE = {
  WIDTH: 600,
  HEIGHT: 600,
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: SIZE.WIDTH, y: SIZE.HEIGHT });

  const { colors } = useColorStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    canvas.height = SIZE.HEIGHT;
    canvas.width = SIZE.WIDTH;

    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);

    for (const stop of colors) {
      gradient.addColorStop(
        stop.offset / 100,
        `rgba(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]}, ${stop.color[3]})`
      );
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [colors, start, end]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const link = document.createElement('a');
    link.download = 'gradient.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleCopyAsPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]);
    });
  };

  return (
    <div
      className={cn(
        'flex min-h-svh justify-between overflow-hidden',
        '[--sidebar-width:25rem]',
        '[--left-sidebar-width:var(--sidebar-width)]',
        '[--right-sidebar-width:var(--sidebar-width)]'
      )}
    >
      <div className="w-[var(--left-sidebar-width)]">
        <LeftSideBar />
      </div>
      <div className="relative w-full py-2">
        <div className="flex h-full w-full items-center justify-center rounded-2xl">
          <canvas className="rounded-2xl" ref={canvasRef} />
          <div
            className="-translate-x-1/2 -translate-y-1/2 _bg-red-400 absolute top-1/2 left-1/2 flex transform items-center justify-center"
            style={{
              width: SIZE.WIDTH,
              height: SIZE.HEIGHT,
            }}
          >
            <InteractiveLine
              end={end}
              setEnd={setEnd}
              setStart={setStart}
              start={start}
            />
          </div>
        </div>
      </div>
      <div className="w-[var(--right-sidebar-width)]">
        <RightSideBar
          onCopyAsPNG={handleCopyAsPNG}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}

export default App;
