import admin from 'firebase-admin';

// Socket.IO authentication middleware
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      socket.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0],
        picture: decodedToken.picture || null,
        emailVerified: decodedToken.email_verified
      };
      next();
    } catch (firebaseError) {
      // Development mode bypass
      if (process.env.NODE_ENV === 'development' && firebaseError.code === 'app/no-app') {
        console.warn('Firebase Admin not configured, allowing socket connection in development mode');
        socket.user = {
          uid: 'dev-user',
          email: 'dev@example.com',
          name: 'Developer',
          emailVerified: true
        };
        next();
      } else {
        console.error('Socket auth error:', firebaseError.message);
        next(new Error('Invalid authentication token'));
      }
    }
  } catch (error) {
    console.error('Socket middleware error:', error);
    next(new Error('Authentication failed'));
  }
};
