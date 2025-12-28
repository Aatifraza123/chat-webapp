import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Video, MessageSquare, UserPlus, UserMinus, Loader2, AtSign } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useFriendRequests } from '@/hooks/useFriendRequests';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  bio?: string;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isOnline?: boolean;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onMessage?: () => void;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  userId,
  isOnline,
  onVoiceCall,
  onVideoCall,
  onMessage,
}: UserProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const { toast } = useToast();
  const { sendFriendRequest, checkFriendStatus } = useFriendRequests();

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${userId}`);
      setProfile(data);
      
      // Check friend status
      if (data.username) {
        const status = await checkFriendStatus(data.username);
        setFriendStatus(status);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile?.username) return;
    
    const result = await sendFriendRequest(profile.username);
    if (result.success) {
      setFriendStatus('sent');
    }
  };

  if (loading || !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl">
                  {profile.name[0]}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-status-online border-4 border-background rounded-full" />
              )}
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold">{profile.name}</h3>
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <AtSign className="w-3 h-3" />
                <p className="text-sm">{profile.username}</p>
              </div>
              {isOnline ? (
                <p className="text-xs text-status-online font-medium">● Online</p>
              ) : (
                <p className="text-xs text-muted-foreground">Offline</p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="w-full">
                <p className="text-sm text-center text-muted-foreground px-4">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          {friendStatus === 'friends' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button variant="outline" onClick={onMessage} className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" onClick={onVoiceCall} className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" onClick={onVideoCall} className="w-full">
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
          ) : friendStatus === 'sent' ? (
            <Button variant="outline" disabled className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Request Sent
            </Button>
          ) : friendStatus === 'received' ? (
            <Button variant="default" className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Accept Friend Request
            </Button>
          ) : (
            <Button variant="default" onClick={handleSendFriendRequest} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Send Friend Request
            </Button>
          )}

          {/* Info Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <AtSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="font-medium">@{profile.username}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
