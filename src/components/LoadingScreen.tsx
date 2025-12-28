import { MessageSquare } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connect Converse</h2>
        <p className="text-sm text-muted-foreground">Loading your chats...</p>
      </div>
    </div>
  );
}
