import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Upload, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WallpaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWallpaper: string;
  onWallpaperChange: (wallpaper: string) => void;
}

const solidColors = [
  { name: 'Default', value: 'default', color: 'bg-background' },
  { name: 'Light Gray', value: 'light-gray', color: 'bg-gray-100' },
  { name: 'Warm White', value: 'warm-white', color: 'bg-orange-50' },
  { name: 'Cool Blue', value: 'cool-blue', color: 'bg-blue-50' },
  { name: 'Mint Green', value: 'mint-green', color: 'bg-green-50' },
  { name: 'Lavender', value: 'lavender', color: 'bg-purple-50' },
  { name: 'Rose', value: 'rose', color: 'bg-rose-50' },
  { name: 'Dark', value: 'dark', color: 'bg-gray-900' },
];

const patterns = [
  { name: 'Dots', value: 'dots', preview: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { name: 'Grid', value: 'grid', preview: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 0h40v1H0V0zm0 10h40v1H0v-1zm0 10h40v1H0v-1zm0 10h40v1H0v-1z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { name: 'Diagonal', value: 'diagonal', preview: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' },
  { name: 'Waves', value: 'waves', preview: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z\' fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' },
  { name: 'Bubbles', value: 'bubbles', preview: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { name: 'Hexagons', value: 'hexagons', preview: 'url("data:image/svg+xml,%3Csvg width=\'28\' height=\'49\' viewBox=\'0 0 28 49\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
];

const gradients = [
  { name: 'Sunset', value: 'sunset', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean', value: 'ocean', gradient: 'linear-gradient(135deg, #667eea 0%, #00d4ff 100%)' },
  { name: 'Forest', value: 'forest', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Fire', value: 'fire', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Night', value: 'night', gradient: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)' },
  { name: 'Aurora', value: 'aurora', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Peach', value: 'peach', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Purple Dream', value: 'purple-dream', gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)' },
];

export function WallpaperDialog({
  open,
  onOpenChange,
  currentWallpaper,
  onWallpaperChange,
}: WallpaperDialogProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState(currentWallpaper);

  const handleSave = () => {
    onWallpaperChange(selectedWallpaper);
    onOpenChange(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setSelectedWallpaper(`custom:${imageUrl}`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Chat Wallpaper</DialogTitle>
          <DialogDescription>
            Customize your chat background with colors, patterns, or gradients
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="gradients">Gradients</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {solidColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedWallpaper(`color:${color.value}`)}
                  className={cn(
                    'relative aspect-square rounded-lg border-2 transition-all hover:scale-105',
                    selectedWallpaper === `color:${color.value}` ? 'border-primary ring-2 ring-primary' : 'border-border',
                    color.color
                  )}
                >
                  {selectedWallpaper === `color:${color.value}` && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-0 right-0 text-[10px] text-center font-medium">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {patterns.map((pattern) => (
                <button
                  key={pattern.value}
                  onClick={() => setSelectedWallpaper(`pattern:${pattern.value}`)}
                  className={cn(
                    'relative aspect-square rounded-lg border-2 transition-all hover:scale-105 overflow-hidden',
                    selectedWallpaper === `pattern:${pattern.value}` ? 'border-primary ring-2 ring-primary' : 'border-border'
                  )}
                  style={{ backgroundImage: pattern.preview }}
                >
                  {selectedWallpaper === `pattern:${pattern.value}` && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-0 right-0 text-[10px] text-center font-medium bg-background/80 py-0.5">
                    {pattern.name}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gradients" className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {gradients.map((gradient) => (
                <button
                  key={gradient.value}
                  onClick={() => setSelectedWallpaper(`gradient:${gradient.value}`)}
                  className={cn(
                    'relative aspect-square rounded-lg border-2 transition-all hover:scale-105',
                    selectedWallpaper === `gradient:${gradient.value}` ? 'border-primary ring-2 ring-primary' : 'border-border'
                  )}
                  style={{ background: gradient.gradient }}
                >
                  {selectedWallpaper === `gradient:${gradient.value}` && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-0 right-0 text-[10px] text-center font-medium text-white bg-black/30 py-0.5">
                    {gradient.name}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Custom Upload */}
        <div className="border-t pt-4">
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">Upload Custom Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Wallpaper
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
