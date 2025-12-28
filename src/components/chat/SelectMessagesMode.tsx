import { Button } from '@/components/ui/button';
import { X, Trash2, Forward, Copy, Star } from 'lucide-react';

interface SelectMessagesModeProps {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
  onForward: () => void;
  onCopy: () => void;
  onStar: () => void;
}

export function SelectMessagesMode({
  selectedCount,
  onCancel,
  onDelete,
  onForward,
  onCopy,
  onStar,
}: SelectMessagesModeProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="w-5 h-5" />
        </Button>
        <span className="font-semibold">{selectedCount} selected</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onStar}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title="Star messages"
        >
          <Star className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title="Copy messages"
        >
          <Copy className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onForward}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title="Forward messages"
        >
          <Forward className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title="Delete messages"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
