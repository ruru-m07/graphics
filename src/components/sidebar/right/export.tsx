import { ArrowUp, Check, Copy, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const Export = ({
  onDownload,
  onCopyAsPNG,
}: {
  onDownload: () => void;
  onCopyAsPNG: () => void;
}) => {
  return (
    <Button
      className="justify-between py-5.5! pr-1! pl-2! text-lg"
      onClick={(e) => {
        e.stopPropagation();
        onDownload();
      }}
    >
      <span className="flex items-center gap-2">
        <ArrowUp className="-mr-1 size-7" strokeWidth={1.7} />
        <span className="flex items-center gap-2">
          Export <span className="font-sans text-xs">1x ⋅ PNG</span>
        </span>
      </span>
      <div className="flex gap-1">
        <CopyButton onCopyAsPNG={onCopyAsPNG} />
        <Button
          className="bg-secondary/20 text-secondary hover:bg-secondary/25"
          size={'icon'}
          variant={'secondary'}
        >
          <Settings2 strokeWidth={2.3} />
        </Button>
      </div>
    </Button>
  );
};

export default Export;

const CopyButton = ({ onCopyAsPNG }: { onCopyAsPNG: () => void }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    setIsCopied(true);
    onCopyAsPNG();
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Button
      className="bg-secondary/20 text-secondary hover:bg-secondary/25"
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      size={'icon'}
      variant={'secondary'}
    >
      {isCopied ? <Check strokeWidth={2.3} /> : <Copy strokeWidth={2.3} />}
    </Button>
  );
};
