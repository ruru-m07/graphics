import { RgbColorPicker } from 'react-colorful';
import { Slider } from '@/components/ui/slider';

type RGBA = [number, number, number, number];

export const CustomColorPicker = ({
  color,
  onChange,
}: {
  color: RGBA;
  onChange: (newColor: RGBA) => void;
}) => {
  const [r, g, b, a] = color;

  const rgbColor = { r, g, b };

  const handleColorChange = (newColor: { r: number; g: number; b: number }) => {
    onChange([newColor.r, newColor.g, newColor.b, a]);
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-xl bg-gray-900">
      <div className="relative">
        <RgbColorPicker
          color={rgbColor}
          onChange={handleColorChange}
          style={{
            width: '256px',
            height: '256px',
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Slider
            className="flex-1"
            max={100}
            onValueChange={(val) => {
              onChange([r, g, b, val[0] / 100]);
            }}
            step={1}
            value={[a * 100]}
          />
          <span className="w-12 text-right font-mono text-gray-300 text-sm">
            {Math.round(a * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
