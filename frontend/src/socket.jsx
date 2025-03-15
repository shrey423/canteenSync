import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_BASE_URL}`, {
  withCredentials: true,
  transports: ['websocket', 'polling'], // Explicitly set transports
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000
});

export default socket;