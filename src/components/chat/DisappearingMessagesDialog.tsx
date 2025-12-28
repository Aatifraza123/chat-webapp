import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Timer } from 'lucide-react';

interface DisappearingMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDuration: string;
  onDurationChange: (duration: string) => void;
}

export function DisappearingMessagesDialog({
  open,
  onOpenChange,
  currentDuration,
  onDurationChange,
}: DisappearingMessagesDialogProps) {
  const durations = [
    { value: 'off', label: 'Off', description: 'Messages will not disappear' },
    { value: '24h', label: '24 hours', description: 'Messages disappear after 24 hours' },
    { value: '7d', label: '7 days', description: 'Messages disappear after 7 days' },
    { value: '90d', label: '90 days', description: 'Messages disappear after 90 days' },
  ];

  const handleSave = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            <DialogTitle>Disappearing Messages</DialogTitle>
          </div>
          <DialogDescription>
            Set messages to automatically disappear after a certain time
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup value={currentDuration} onValueChange={onDurationChange} className="space-y-3">
          {durations.map((duration) => (
            <label
              key={duration.value}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
            >
              <RadioGroupItem value={duration.value} className="mt-1" />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">{duration.label}</Label>
                <p className="text-sm text-muted-foreground">{duration.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
