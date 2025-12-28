import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1 px-4 py-2', className)}>
      <div className="typing-indicator flex gap-1">
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}
