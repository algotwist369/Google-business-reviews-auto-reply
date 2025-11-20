import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { API_URL } from '../utils/constants';

/**
 * Custom hook for WebSocket connection
 * Manages real-time communication with the server
 */
export const useWebSocket = (token, onConnect, onDisconnect) => {
  const socketRef = useRef(null);
  const activeTokenRef = useRef(null);
  const isConnectingRef = useRef(false);
  const skipInitialCleanupRef = useRef(import.meta.env?.DEV ?? false);

  const disconnectSocket = useCallback(() => {
    if (!socketRef.current) return;
    try {
      socketRef.current.disconnect();
    } catch (err) {
      console.warn('WebSocket disconnect error:', err);
      try {
        socketRef.current.close();
      } catch (closeErr) {
        console.warn('WebSocket close error:', closeErr);
      }
    }
    socketRef.current = null;
    activeTokenRef.current = null;
    isConnectingRef.current = false;
  }, []);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    if (activeTokenRef.current === token && socketRef.current) {
      return;
    }

    if (socketRef.current) {
      disconnectSocket();
    }

    isConnectingRef.current = true;

    const socket = io(API_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    socketRef.current = socket;
    activeTokenRef.current = token;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      toast.dismiss('ws-connection-error');
      isConnectingRef.current = false;
      if (onConnect) onConnect();
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      isConnectingRef.current = false;
      if (onDisconnect) onDisconnect(reason);
    });

    socket.on('connect_error', () => {
      toast.error('Live updates disconnected. Attempting to reconnect…', {
        id: 'ws-connection-error'
      });
      isConnectingRef.current = false;
    });

    return () => {
      if (skipInitialCleanupRef.current) {
        skipInitialCleanupRef.current = false;
        return;
      }
      if (socketRef.current === socket) {
        disconnectSocket();
      } else {
        try {
          socket.disconnect();
        } catch (err) {
          console.warn('WebSocket disconnect error:', err);
        }
      }
    };
  }, [token, onConnect, onDisconnect, disconnectSocket]);

  const subscribe = useCallback((event, callback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(event, callback);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const isConnected = socketRef.current?.connected || false;

  return {
    socket: socketRef.current,
    subscribe,
    emit,
    isConnected
  };
};

