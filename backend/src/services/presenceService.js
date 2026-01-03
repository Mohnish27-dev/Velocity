// In-memory presence store (can be replaced with Redis for scaling)
const onlineUsers = new Map();

export const presenceService = {
  async setOnline(uid, userData) {
    onlineUsers.set(uid, {
      ...userData,
      lastSeen: new Date(),
      status: 'online'
    });
  },

  async setOffline(uid) {
    const user = onlineUsers.get(uid);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      // Keep in map for a while for "last seen" info
      setTimeout(() => {
        const currentUser = onlineUsers.get(uid);
        if (currentUser && currentUser.status === 'offline') {
          onlineUsers.delete(uid);
        }
      }, 5 * 60 * 1000); // Remove after 5 minutes
    }
  },

  async setAway(uid) {
    const user = onlineUsers.get(uid);
    if (user) {
      user.status = 'away';
      user.lastSeen = new Date();
    }
  },

  async getStatus(uid) {
    const user = onlineUsers.get(uid);
    return user ? user.status : 'offline';
  },

  async getOnlineUsers() {
    const users = [];
    for (const [uid, data] of onlineUsers) {
      if (data.status === 'online') {
        users.push({
          uid,
          name: data.name,
          email: data.email,
          picture: data.picture,
          status: data.status,
          lastSeen: data.lastSeen
        });
      }
    }
    return users;
  },

  async getAllUsersWithStatus() {
    const users = [];
    for (const [uid, data] of onlineUsers) {
      users.push({
        uid,
        name: data.name,
        email: data.email,
        picture: data.picture,
        status: data.status,
        lastSeen: data.lastSeen
      });
    }
    return users;
  },

  async isOnline(uid) {
    const user = onlineUsers.get(uid);
    return user && user.status === 'online';
  },

  async getOnlineCount() {
    let count = 0;
    for (const [, data] of onlineUsers) {
      if (data.status === 'online') count++;
    }
    return count;
  }
};

export default presenceService;
