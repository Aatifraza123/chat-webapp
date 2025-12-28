import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
  userName?: string;
}

export function TypingIndicator({ className, userName }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2.5', className)}>
      <div className="typing-indicator flex gap-1">
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
      </div>
      {userName && (
        <span className="text-xs text-muted-foreground">{userName} is typing</span>
      )}
    </div>
  );
}
