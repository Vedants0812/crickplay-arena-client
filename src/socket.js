import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL 
  || 'https://crickplay-arena-server.onrender.com';

console.log('[socket] connecting to:', SERVER_URL);

const socket = io(SERVER_URL, {
  autoConnect:          false,
  reconnection:         true,
  reconnectionAttempts: 10,
  reconnectionDelay:    1000,
  reconnectionDelayMax: 5000,
  timeout:              20000,
  transports:           ['polling', 'websocket'],
  withCredentials:      true,
});

export default socket;
