import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
// For production, use a service account key file
// For development, we'll use the project ID and let ADC handle auth

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

let initialized = false;

// Check if we have a service account file or JSON string
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // Service account JSON provided as environment variable (for production)
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: firebaseConfig.storageBucket
    });
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized with service account from env');
  } catch (error) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  // Service account file path provided
  try {
    const serviceAccountPath = resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: firebaseConfig.storageBucket
    });
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized with service account file');
  } catch (error) {
    console.error('❌ Failed to load service account file:', error.message);
  }
}

// Fallback: Initialize without credentials for development
if (!initialized) {
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket
    });
    initialized = true;
    console.log('⚠️ Firebase Admin SDK initialized without credentials (limited functionality)');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  }
}

// Export Firestore and Storage instances
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

// Firestore settings for better performance
db.settings({
  ignoreUndefinedProperties: true
});

export default admin;
