import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Video, Bell, Heart, Ban, Trash2 } from 'lucide-react';
import { ChatParticipant } from '@/hooks/useChat';

interface ContactInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ChatParticipant;
  isOnline: boolean;
  isMuted: boolean;
  isFavourite: boolean;
  isBlocked: boolean;
  onMuteToggle: () => void;
  onFavouriteToggle: () => void;
  onBlock: () => void;
  onDeleteChat: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
}

export function ContactInfoDialog({
  open,
  onOpenChange,
  user,
  isOnline,
  isMuted,
  isFavourite,
  isBlocked,
  onMuteToggle,
  onFavouriteToggle,
  onBlock,
  onDeleteChat,
  onVoiceCall,
  onVideoCall,
}: ContactInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Info</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center gap-3 py-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-3xl">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isOnline ? (
                  <span className="text-status-online">● Online</span>
                ) : (
                  <span>Offline</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onVoiceCall}>
              <Phone className="w-4 h-4 mr-2" />
              Voice Call
            </Button>
            <Button variant="outline" onClick={onVideoCall}>
              <Video className="w-4 h-4 mr-2" />
              Video Call
            </Button>
          </div>

          <Separator />

          {/* Contact Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onMuteToggle}
            >
              <Bell className="w-4 h-4 mr-2" />
              {isMuted ? 'Unmute notifications' : 'Mute notifications'}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onFavouriteToggle}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavourite ? 'fill-current text-red-500' : ''}`} />
              {isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            </Button>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={onBlock}
            >
              <Ban className="w-4 h-4 mr-2" />
              {isBlocked ? 'Unblock user' : 'Block user'}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={onDeleteChat}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
