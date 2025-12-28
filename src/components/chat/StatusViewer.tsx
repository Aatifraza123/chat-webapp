import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { Button } from '@/components/ui/button';
import { Status, UserStatus } from '@/hooks/useStatus';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface StatusViewerProps {
  userStatuses: UserStatus[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onView: (statusId: string) => void;
  onDelete?: (statusId: string) => void;
  currentUserId: string;
}

export function StatusViewer({
  userStatuses,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onView,
  onDelete,
  currentUserId,
}: StatusViewerProps) {
  const currentUserStatus = userStatuses[currentIndex];
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  if (!currentUserStatus || !currentUserStatus.statuses.length) {
    return null;
  }

  const currentStatus = currentUserStatus.statuses[currentStatusIndex];
  const isOwn = currentUserStatus.user.id === currentUserId;

  const handleNext = () => {
    if (currentStatusIndex < currentUserStatus.statuses.length - 1) {
      setCurrentStatusIndex(prev => prev + 1);
      onView(currentUserStatus.statuses[currentStatusIndex + 1].id);
    } else {
      // Move to next user's status
      setCurrentStatusIndex(0);
      onNext();
    }
  };

  const handlePrevious = () => {
    if (currentStatusIndex > 0) {
      setCurrentStatusIndex(prev => prev - 1);
    } else if (currentIndex > 0) {
      // Move to previous user's status
      onPrevious();
      setCurrentStatusIndex(0);
    }
  };

  const handleDelete = () => {
    if (onDelete && isOwn) {
      onDelete(currentStatus.id);
      if (currentStatusIndex > 0) {
        setCurrentStatusIndex(prev => prev - 1);
      } else if (currentUserStatus.statuses.length === 1) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentUserStatus.user.avatar_url}
              alt={currentUserStatus.user.name}
              size="sm"
            />
            <div>
              <p className="text-white font-medium">{currentUserStatus.user.name}</p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwn && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-white hover:bg-white/20"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex gap-1 mt-3">
          {currentUserStatus.statuses.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={cn(
                  'h-full bg-white transition-all duration-300',
                  idx < currentStatusIndex ? 'w-full' : idx === currentStatusIndex ? 'w-full' : 'w-0'
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        disabled={currentIndex === 0 && currentStatusIndex === 0}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center p-4">
        {currentStatus.type === 'text' ? (
          <div className="text-white text-2xl md:text-4xl font-medium text-center max-w-2xl px-8">
            {currentStatus.content}
          </div>
        ) : currentStatus.type === 'image' ? (
          <img
            src={currentStatus.content}
            alt="Status"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={currentStatus.content}
            controls
            autoPlay
            className="max-w-full max-h-full"
          />
        )}
      </div>

      {/* Views count (for own status) */}
      {isOwn && currentStatus.views.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm">
          👁️ {currentStatus.views.length} {currentStatus.views.length === 1 ? 'view' : 'views'}
        </div>
      )}
    </div>
  );
}
