import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/socketAuth.js';
import { setupSocketHandlers } from '../services/socketService.js';
import { presenceService } from '../services/presenceService.js';

let io = null;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.user.uid})`);

    // Track user presence
    await presenceService.setOnline(socket.user.uid, socket.user);
    
    // Join user's personal room for DMs
    socket.join(`user:${socket.user.uid}`);

    // Broadcast user online status
    io.emit('user_online', {
      uid: socket.user.uid,
      name: socket.user.name,
      timestamp: new Date()
    });

    // Setup all socket event handlers
    setupSocketHandlers(io, socket);

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`❌ User disconnected: ${socket.user.name} - ${reason}`);
      
      await presenceService.setOffline(socket.user.uid);
      
      io.emit('user_offline', {
        uid: socket.user.uid,
        name: socket.user.name,
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.name}:`, error);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export default { initializeSocket, getIO };
