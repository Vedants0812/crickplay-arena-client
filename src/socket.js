import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

// Debug helpers (remove in production)
if (import.meta.env.DEV) {
  socket.onAny((event, ...args) => {
    console.log(`[socket] ← ${event}`, args);
  });
}

export default socket;
