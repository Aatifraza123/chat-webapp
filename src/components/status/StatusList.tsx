import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UserStatus } from '@/hooks/useStatus';
import { cn } from '@/lib/utils';

interface StatusListProps {
  statuses: UserStatus[];
  myStatuses: any[];
  onViewStatus: (userStatus: UserStatus, index: number) => void;
  onCreateStatus: () => void;
  currentUserId: string;
  currentUserAvatar: string;
  currentUserName: string;
}

export function StatusList({
  statuses,
  myStatuses,
  onViewStatus,
  onCreateStatus,
  currentUserId,
  currentUserAvatar,
  currentUserName,
}: StatusListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* My Status */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-14 h-14">
              <AvatarImage src={currentUserAvatar} />
              <AvatarFallback>{currentUserName[0]}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full"
              onClick={onCreateStatus}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1">
            <p className="font-medium">My Status</p>
            <p className="text-sm text-muted-foreground">
              {myStatuses.length > 0
                ? `${myStatuses.length} status${myStatuses.length > 1 ? 'es' : ''}`
                : 'Tap to add status'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      {statuses.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground">Recent updates</p>
          </div>
          {statuses.map((userStatus, index) => (
            <button
              key={userStatus.user.id}
              onClick={() => onViewStatus(userStatus, 0)}
              className="w-full p-4 flex items-center gap-3 hover:bg-accent transition-colors"
            >
              <div className="relative">
                <Avatar className={cn(
                  "w-14 h-14 ring-2 ring-primary ring-offset-2",
                  userStatus.statuses.some(s => 
                    s.views.some(v => v.user_id === currentUserId)
                  ) && "ring-muted"
                )}>
                  <AvatarImage src={userStatus.user.avatar_url} />
                  <AvatarFallback>{userStatus.user.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{userStatus.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(userStatus.statuses[0].created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {statuses.length === 0 && myStatuses.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <p className="text-muted-foreground mb-4">No status updates yet</p>
          <Button onClick={onCreateStatus}>
            <Plus className="w-4 h-4 mr-2" />
            Create Status
          </Button>
        </div>
      )}
    </div>
  );
}
