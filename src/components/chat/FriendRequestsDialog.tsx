import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, UserPlus, Clock, Loader2 } from 'lucide-react';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { formatDistanceToNow } from 'date-fns';

interface FriendRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendRequestsDialog({
  open,
  onOpenChange,
}: FriendRequestsDialogProps) {
  const {
    pendingRequests,
    sentRequests,
    loading,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
  } = useFriendRequests();

  const handleAccept = async (requestId: string) => {
    const result = await acceptFriendRequest(requestId);
    if (result.success) {
      // Optionally navigate to the new chat
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Friend Requests</DialogTitle>
          <DialogDescription>
            Manage your friend requests
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Received {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-3 max-h-96 overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={request.from?.avatar_url} />
                    <AvatarFallback>
                      {request.from?.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {request.from?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{request.from?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(request.id)}
                      disabled={loading}
                      className="h-8 w-8 p-0"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectFriendRequest(request.id)}
                      disabled={loading}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-3 max-h-96 overflow-y-auto">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sent requests</p>
              </div>
            ) : (
              sentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={request.to?.avatar_url} />
                    <AvatarFallback>
                      {request.to?.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {request.to?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{request.to?.username}
                    </p>
                    <p className="text-xs text-status-typing">
                      Pending
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelFriendRequest(request.id)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
