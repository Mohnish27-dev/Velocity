import admin from 'firebase-admin';

// Helper function to decode JWT payload without verification (for development only)
const decodeTokenPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

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
      // Development mode bypass - extract user info from token without verification
      if (process.env.NODE_ENV === 'development') {
        console.warn('Firebase Admin verification failed, using token payload in development mode');
        const tokenPayload = decodeTokenPayload(token);
        
        if (tokenPayload && tokenPayload.user_id) {
          socket.user = {
            uid: tokenPayload.user_id,
            email: tokenPayload.email || 'unknown@example.com',
            name: tokenPayload.name || tokenPayload.email?.split('@')[0] || 'User',
            picture: tokenPayload.picture || null,
            emailVerified: tokenPayload.email_verified || false
          };
          next();
        } else {
          console.error('Could not extract user info from token');
          next(new Error('Invalid authentication token'));
        }
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
