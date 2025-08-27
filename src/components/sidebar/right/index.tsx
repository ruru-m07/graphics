import Color from 'color';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CustomColorPicker } from '@/components/ui/shadcn-io/color-picker';
import { useColorStore } from '@/lib/zustand';
import Export from './export';

const RightSideBar = ({
  onDownload,
  onCopyAsPNG,
}: {
  onDownload: () => void;
  onCopyAsPNG: () => void;
}) => {
  const { colors, addColor } = useColorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);

    for (const stop of colors) {
      const [r, g, b, a] = stop.color;
      gradient.addColorStop(stop.offset / 100, `rgba(${r}, ${g}, ${b}, ${a})`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [colors]);

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <Export onCopyAsPNG={onCopyAsPNG} onDownload={onDownload} />
      <div className="flex-1 overflow-auto rounded-2xl bg-secondary p-4">
        <Label className="mb-4">Linear Gradient</Label>
        <canvas className="mb-4 h-10 w-full rounded-md" ref={canvasRef} />
        {colors
          .sort((a, b) => a.offset - b.offset)
          .map((color) => (
            <ColorBox id={color.id} key={color.id} />
          ))}
        <Button
          className="mt-2 w-full"
          onClick={() => {
            /**
             * Add logic to determine the color and offset of the new color stop
             * to find the the step of new color stop, we can look at the last two color stops
             * and find the stop in between those 2
             * if there is only one item in colors.
             * new stop will be 0%
             */
            // const last = colors[colors.length - 1];
            // const secondLast = colors[colors.length - 2];
            const last = colors.at(-1);
            const secondLast = colors.at(-2);

            if (!(last || secondLast)) {
              addColor([255, 255, 255, 1], 0);
              return;
            }

            if (!(last && secondLast)) {
              addColor([...colors[0].color], 0);
              return;
            }

            if (secondLast) {
              // Find midpoint offset
              const newOffset = (last.offset + secondLast.offset) / 2;

              // Blend RGBA values
              const [r1, g1, b1, a1] = secondLast.color;
              const [r2, g2, b2, a2] = last.color;

              const newColor: [number, number, number, number] = [
                Math.round((r1 + r2) / 2),
                Math.round((g1 + g2) / 2),
                Math.round((b1 + b2) / 2),
                (a1 + a2) / 2, // alpha doesn’t need rounding
              ];

              addColor(newColor, newOffset);
            } else {
              // If there is only one color stop, add the new stop at 0%
              addColor([...colors[0].color], 0);
            }
          }}
        >
          <Plus />
          Add Color
        </Button>
      </div>
    </div>
  );
};

export default RightSideBar;

const ColorBox = ({ id }: { id: string }) => {
  const { colors, updateColor, updateOffset, removeColor } = useColorStore();
  const current = colors.find((color) => color.id === id);

  if (!current) {
    return null;
  }

  const [r, g, b, a] = current.color;
  const hex = Color.rgb(r, g, b).hex();

  return (
    <div className="mb-2 flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="size-9 cursor-pointer rounded-md border border-input"
            style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})` }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-fit space-y-4 p-4">
          <CustomColorPicker
            color={[r, g, b, a]}
            onChange={(newColor) => updateColor(id, newColor)}
          />
        </PopoverContent>
      </Popover>

      <Input
        className="w-30"
        onChange={(e) => {
          try {
            const c = Color(e.target.value).rgb().array();
            updateColor(id, [c[0], c[1], c[2], a]);
          } catch {
            // invalid hex, ignore
          }
        }}
        value={hex}
      />
      <Input
        className="w-fit"
        max={100}
        min={0}
        onChange={(e) => {
          const value = Number.parseFloat(e.target.value);
          if (!Number.isNaN(value)) {
            updateOffset(id, value);
          }
        }}
        type="number"
        value={current.offset}
      />
      <Button
        onClick={() => {
          removeColor(id);
        }}
        size={'sm'}
        variant={'ghost'}
      >
        <Minus />
      </Button>
    </div>
  );
};
