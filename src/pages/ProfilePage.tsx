import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera, Loader2, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser, deleteAccount } = useAuth();
  const { toast } = useToast();
  const { uploadProfilePicture, isUploading, uploadProgress } = useProfilePicture();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio('');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadProfilePicture(file);
    if (url) {
      setAvatarUrl(url);
      
      // Refresh user data from AuthContext
      await refreshUser();
      
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been updated successfully',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/profile', {
        name,
        avatar_url: avatarUrl,
        bio,
      });

      // Refresh user data from AuthContext
      await refreshUser();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const { error } = await deleteAccount();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted',
      });
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/chat')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Profile</h1>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-4xl">
                  {name[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {uploadProgress > 0 && (
                      <span className="text-xs mt-1">{uploadProgress}%</span>
                    )}
                  </div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Click camera icon to change profile picture
            </p>
          </div>

          {/* Username (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={user?.username || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Your unique username cannot be changed
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email (Private)</label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Your email is private and not visible to other users
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="w-full"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>

          {/* Danger Zone */}
          <div className="pt-6 border-t space-y-4">
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. All your data will be permanently deleted.
            </p>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All your messages</li>
                <li>All your chats</li>
                <li>Your profile information</li>
                <li>Your friend connections</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
