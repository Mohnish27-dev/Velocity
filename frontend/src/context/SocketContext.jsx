import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket, getSocket, socketEvents } from '../services/socket';

const SocketContext = createContext(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Initialize socket when user logs in
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      if (user) {
        const socketInstance = await initializeSocket();
        if (mounted && socketInstance) {
          setSocket(socketInstance);

          socketInstance.on('connect', () => {
            setIsConnected(true);
          });

          socketInstance.on('disconnect', () => {
            setIsConnected(false);
          });

          // Listen for online users updates
          socketInstance.on('online_users', ({ users }) => {
            setOnlineUsers(users);
          });

          socketInstance.on('user_online', ({ uid, name }) => {
            setOnlineUsers(prev => {
              if (!prev.some(u => u.uid === uid)) {
                return [...prev, { uid, name, status: 'online' }];
              }
              return prev;
            });
          });

          socketInstance.on('user_offline', ({ uid }) => {
            setOnlineUsers(prev => prev.filter(u => u.uid !== uid));
          });

          socketInstance.on('user_status_changed', ({ uid, status }) => {
            setOnlineUsers(prev => 
              prev.map(u => u.uid === uid ? { ...u, status } : u)
            );
          });

          // Get initial online users
          socketEvents.getOnlineUsers();
        }
      } else {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      if (!user) {
        disconnectSocket();
      }
    };
  }, [user]);

  // Subscribe to socket events
  const subscribe = useCallback((event, callback) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.on(event, callback);
      return () => currentSocket.off(event, callback);
    }
    return () => {};
  }, []);

  // Emit socket events
  const emit = useCallback((event, data) => {
    const currentSocket = getSocket();
    if (currentSocket?.connected) {
      currentSocket.emit(event, data);
    }
  }, []);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    subscribe,
    emit,
    ...socketEvents
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
