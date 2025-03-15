import { io } from 'socket.io-client';

const socket = process.env.NODE_ENV === 'production'
  ? io()
  : io(`${import.meta.env.VITE_BASE_URL}`, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    });

export default socket;