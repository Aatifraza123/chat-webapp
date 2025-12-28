import { createContext, useContext, ReactNode } from 'react';
import { usePresence } from '@/hooks/usePresence';

interface PresenceContextType {
  onlineUsers: Set<string>;
  isUserOnline: (odissey_id: string) => boolean;
  onlineCount: number;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const presence = usePresence();

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  return context;
}
