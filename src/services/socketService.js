import { io } from 'socket.io-client';

// Singleton socket instance connected to current window host
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
  }
  return socket;
}
