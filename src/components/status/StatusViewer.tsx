import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserStatus, Status } from '@/hooks/useStatus';
import { Progress } from '@/components/ui/progress';

interface StatusViewerProps {
  userStatus: UserStatus | null;
  initialIndex: number;
  onClose: () => void;
  onView: (statusId: string) => void;
}

export function StatusViewer({ userStatus, initialIndex, onClose, onView }: StatusViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!userStatus) return;

    const status = userStatus.statuses[currentIndex];
    if (status) {
      onView(status.id);
    }

    setProgress(0);
    const duration = 5000; // 5 seconds per status
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, userStatus]);

  const handleNext = () => {
    if (!userStatus) return;
    
    if (currentIndex < userStatus.statuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!userStatus) return null;

  const currentStatus = userStatus.statuses[currentIndex];

  return (
    <Dialog open={!!userStatus} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-black">
        <div className="relative h-[600px] flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
            {userStatus.statuses.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <Progress
                  value={index === currentIndex ? progress : index < currentIndex ? 100 : 0}
                  className="h-full"
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10 ring-2 ring-white">
                <AvatarImage src={userStatus.user.avatar_url} />
                <AvatarFallback>{userStatus.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="font-medium">{userStatus.user.name}</p>
                <p className="text-xs opacity-80">
                  {new Date(currentStatus.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            {currentStatus.type === 'text' && (
              <p className="text-white text-2xl text-center font-medium px-8">
                {currentStatus.content}
              </p>
            )}
            {currentStatus.type === 'image' && (
              <img
                src={currentStatus.content}
                alt="Status"
                className="max-w-full max-h-full object-contain"
              />
            )}
            {currentStatus.type === 'video' && (
              <video
                src={currentStatus.content}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="pointer-events-auto text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            <div className="flex-1" />
            {currentIndex < userStatus.statuses.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="pointer-events-auto text-white hover:bg-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
