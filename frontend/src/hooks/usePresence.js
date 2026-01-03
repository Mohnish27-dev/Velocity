import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Custom hook to track user presence status
 * @param {string[]} userIds - Array of user IDs to track
 */
export function usePresence(userIds = []) {
  const { onlineUsers, subscribe } = useSocket();
  const [presenceMap, setPresenceMap] = useState({});

  // Update presence map when online users change
  useEffect(() => {
    const map = {};
    userIds.forEach(uid => {
      const user = onlineUsers.find(u => u.uid === uid);
      map[uid] = {
        isOnline: !!user,
        status: user?.status || 'offline',
        lastSeen: user?.lastSeen || null
      };
    });
    setPresenceMap(map);
  }, [userIds, onlineUsers]);

  // Subscribe to status changes
  useEffect(() => {
    const unsubOnline = subscribe('user_online', ({ uid }) => {
      if (userIds.includes(uid)) {
        setPresenceMap(prev => ({
          ...prev,
          [uid]: { isOnline: true, status: 'online', lastSeen: new Date() }
        }));
      }
    });

    const unsubOffline = subscribe('user_offline', ({ uid }) => {
      if (userIds.includes(uid)) {
        setPresenceMap(prev => ({
          ...prev,
          [uid]: { isOnline: false, status: 'offline', lastSeen: new Date() }
        }));
      }
    });

    const unsubStatusChange = subscribe('user_status_changed', ({ uid, status }) => {
      if (userIds.includes(uid)) {
        setPresenceMap(prev => ({
          ...prev,
          [uid]: { ...prev[uid], status, lastSeen: new Date() }
        }));
      }
    });

    return () => {
      unsubOnline();
      unsubOffline();
      unsubStatusChange();
    };
  }, [userIds, subscribe]);

  // Helper function to check if a specific user is online
  const isUserOnline = (uid) => presenceMap[uid]?.isOnline || false;

  // Helper function to get user status
  const getUserStatus = (uid) => presenceMap[uid]?.status || 'offline';

  return {
    presenceMap,
    isUserOnline,
    getUserStatus,
    onlineCount: onlineUsers.length
  };
}

export default usePresence;
