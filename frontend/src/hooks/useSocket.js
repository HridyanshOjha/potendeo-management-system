import { useEffect, useRef } from 'react';
import { getSocket } from '../utils/socket';

/**
 * Subscribe to socket events and auto-clean-up on unmount.
 *
 * Usage:
 *   useSocket('group:message', (msg) => { ... });
 *   useSocket(['typing:start', 'typing:stop'], (event, data) => { ... });
 */
export function useSocket(events, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const eventList = Array.isArray(events) ? events : [events];

    const listeners = eventList.map(event => {
      const listener = (data) => handlerRef.current(event, data);
      socket.on(event, listener);
      return { event, listener };
    });

    return () => {
      listeners.forEach(({ event, listener }) => {
        socket.off(event, listener);
      });
    };
  }, []);
}

/**
 * Emit a socket event imperatively.
 * Returns a stable emit function.
 */
export function useSocketEmit() {
  const emit = (event, data) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  };
  return emit;
}
