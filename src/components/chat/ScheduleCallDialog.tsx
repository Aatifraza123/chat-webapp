import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, Phone, Video } from 'lucide-react';

interface ScheduleCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (data: { date: string; time: string; type: 'voice' | 'video' }) => void;
}

export function ScheduleCallDialog({
  open,
  onOpenChange,
  onSchedule,
}: ScheduleCallDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  const handleSchedule = () => {
    if (date && time) {
      onSchedule({ date, time, type: callType });
      onOpenChange(false);
      setDate('');
      setTime('');
      setCallType('voice');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Call</DialogTitle>
          <DialogDescription>
            Schedule a call with this contact
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Call Type */}
          <div className="space-y-2">
            <Label>Call Type</Label>
            <RadioGroup value={callType} onValueChange={(v) => setCallType(v as 'voice' | 'video')} className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="voice" />
                <Phone className="w-4 h-4" />
                <span className="text-sm">Voice Call</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="video" />
                <Video className="w-4 h-4" />
                <span className="text-sm">Video Call</span>
              </label>
            </RadioGroup>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!date || !time}>
            Schedule Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
