import { CircleCheckIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import LeftSideBar from './components/sidebar/left';
import RightSideBar from './components/sidebar/right';
import { Button } from './components/ui/button';
import InteractiveLine from './interactive-line';
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

    /**
     * HiDPI rendering: scale canvas by devicePixelRatio.
     * Scale canvas resolution for HiDPI (Retina) displays
     */
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE.WIDTH * dpr;
    canvas.height = SIZE.HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);

    const stops = [...colors].sort((a, b) => a.offset - b.offset);
    for (const stop of stops) {
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
    canvas.toBlob(async (blob) => {
      if (!blob) {
        return;
      }
      try {
        /**
         * Prefer binary image copy if supported
         * Some browsers lack ClipboardItem or block image writes; provide a text fallback and catch errors.
         */
        if (typeof window.ClipboardItem !== 'undefined') {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
        } else {
          const dataUrl = canvas.toDataURL('image/png');
          await navigator.clipboard.writeText(dataUrl);
        }
        toast.custom((t) => (
          <div className="w-full rounded-md border bg-background px-4 py-3 text-foreground shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
              <div className="flex grow gap-3">
                <CircleCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-emerald-500"
                  size={16}
                />
                <div className="flex grow justify-between gap-12">
                  <p className="text-sm">Gradient copied to clipboard!</p>
                </div>
              </div>
              <Button
                aria-label="Close banner"
                className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                onClick={() => toast.dismiss(t)}
                variant="ghost"
              >
                <XIcon
                  aria-hidden="true"
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  size={16}
                />
              </Button>
            </div>
          </div>
        ));
      } catch (err) {
        console.error('Copy failed', err);
        toast.custom((t) => (
          <div className="w-full rounded-md border bg-background px-4 py-3 text-foreground shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
              <div className="flex grow gap-3">
                <CircleCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-emerald-500"
                  size={16}
                />
                <div className="flex grow justify-between gap-12">
                  <p className="text-sm">Data URL copied to clipboard!</p>
                </div>
              </div>
              <Button
                aria-label="Close banner"
                className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                onClick={() => toast.dismiss(t)}
                variant="ghost"
              >
                <XIcon
                  aria-hidden="true"
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  size={16}
                />
              </Button>
            </div>
          </div>
        ));
      }
    }, 'image/png');
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
      <Toaster />
    </div>
  );
}

export default App;
