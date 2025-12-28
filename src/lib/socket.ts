import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  // Disconnect existing socket if any
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    // Don't auto-reconnect if disconnected due to auth error
    if (reason === 'io server disconnect') {
      socket?.disconnect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    // If auth error, disconnect and don't retry
    if (error.message.includes('Authentication')) {
      socket?.disconnect();
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
