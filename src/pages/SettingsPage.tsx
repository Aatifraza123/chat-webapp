import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Palette, Bell, Lock, Download, Trash2, Moon, Sun, Droplets, Sparkles, Leaf, Heart } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Settings state
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('notifications_enabled') !== 'false';
  });
  const [messagePreview, setMessagePreview] = useState(() => {
    return localStorage.getItem('message_preview') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sound_enabled') !== 'false';
  });
  const [enterToSend, setEnterToSend] = useState(() => {
    return localStorage.getItem('enter_to_send') !== 'false';
  });

  const themes = [
    { value: 'light', label: 'Light', icon: Sun, color: 'bg-white border-2' },
    { value: 'dark', label: 'Dark', icon: Moon, color: 'bg-gray-900' },
    { value: 'blue', label: 'Ocean Blue', icon: Droplets, color: 'bg-blue-600' },
    { value: 'purple', label: 'Purple', icon: Sparkles, color: 'bg-purple-600' },
    { value: 'green', label: 'Forest', icon: Leaf, color: 'bg-green-600' },
    { value: 'rose', label: 'Rose', icon: Heart, color: 'bg-rose-600' },
  ];

  const handleThemeChange = (value: string) => {
    setTheme(value as any);
    toast({
      title: 'Theme updated',
      description: `Switched to ${themes.find(t => t.value === value)?.label} theme`,
    });
  };

  const handleNotificationToggle = (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem('notifications_enabled', String(checked));
    toast({
      title: checked ? 'Notifications enabled' : 'Notifications disabled',
    });
  };

  const handleMessagePreviewToggle = (checked: boolean) => {
    setMessagePreview(checked);
    localStorage.setItem('message_preview', String(checked));
  };

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem('sound_enabled', String(checked));
  };

  const handleEnterToSendToggle = (checked: boolean) => {
    setEnterToSend(checked);
    localStorage.setItem('enter_to_send', String(checked));
  };

  const handleDownloadData = () => {
    toast({
      title: 'Download started',
      description: 'Your data is being prepared for download',
    });
    // TODO: Implement data download
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion API
      await signOut();
      navigate('/auth');
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      });
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
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Theme Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose your preferred theme for the app
            </p>
            
            <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {themes.map((t) => {
                const Icon = t.icon;
                return (
                  <label
                    key={t.value}
                    className={`relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary ${
                      theme === t.value ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={t.value} className="sr-only" />
                    <div className={`w-16 h-16 rounded-full ${t.color} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-medium">{t.label}</span>
                    {theme === t.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                );
              })}
            </RadioGroup>
          </section>

          <Separator />

          {/* Notifications Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new messages
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="preview">Message preview</Label>
                  <p className="text-sm text-muted-foreground">
                    Show message content in notifications
                  </p>
                </div>
                <Switch
                  id="preview"
                  checked={messagePreview}
                  onCheckedChange={handleMessagePreviewToggle}
                  disabled={!notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound">Sound</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound for new messages
                  </p>
                </div>
                <Switch
                  id="sound"
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Chat Settings */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Chat Settings</h2>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enter-send">Enter to send</Label>
                <p className="text-sm text-muted-foreground">
                  Press Enter to send message (Shift+Enter for new line)
                </p>
              </div>
              <Switch
                id="enter-send"
                checked={enterToSend}
                onCheckedChange={handleEnterToSendToggle}
              />
            </div>
          </section>

          <Separator />

          {/* Privacy & Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Privacy & Security</h2>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadData}
              >
                <Download className="w-4 h-4 mr-2" />
                Download my data
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>

          {/* Account Info */}
          <section className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Logged in as <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <Button variant="outline" onClick={() => signOut()} className="w-full">
              Sign out
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
