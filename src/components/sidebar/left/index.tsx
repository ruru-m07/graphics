import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LeftSideBar = () => {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <Button className="justify-between py-5.5! text-lg" variant={'secondary'}>
        <img alt="logo" height={20} src="/ruru.svg" width={20} />
        <ChevronRight
          className="size-5.5 text-muted-foreground"
          strokeWidth={1.5}
        />
        <img
          alt="logo"
          className="-ml-2 mr-2"
          height={40}
          src="/template.svg"
          width={40}
        />
        Template
        <ChevronRight
          className="size-5.5 text-muted-foreground"
          strokeWidth={1.5}
        />
      </Button>
      <div className="flex-1 overflow-auto rounded-2xl bg-secondary" />
    </div>
  );
};

export default LeftSideBar;
