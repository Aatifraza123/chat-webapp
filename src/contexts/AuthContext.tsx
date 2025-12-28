import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  session: { token: string } | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Set timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        setIsLoading(false);
        localStorage.removeItem('auth_token');
      }, 5000);

      api.get('/auth/me')
        .then(({ data }) => {
          clearTimeout(timeout);
          setUser(data);
          setSession({ token });
          connectSocket(token);
          setIsLoading(false);
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Auth check failed:', error);
          localStorage.removeItem('auth_token');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data } = await api.post('/auth/signup', { email, password, name });
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setSession({ token: data.token });
      connectSocket(data.token);
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.error || 'Failed to sign up') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/signin', { email, password });
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setSession({ token: data.token });
      connectSocket(data.token);
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.error || 'Failed to sign in') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setSession(null);
    disconnectSocket();
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
