import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

let initialized = false;

// Check if we have a service account file
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    // Resolve path relative to backend folder
    const serviceAccountPath = join(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    // Check if file exists before trying to read it
    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: firebaseConfig.storageBucket
      });
      initialized = true;
      console.log('✅ Firebase Admin SDK initialized with service account');
    } else {
      console.warn('⚠️  Service account file not found at:', serviceAccountPath);
      console.warn('   Please download it from Firebase Console > Project Settings > Service Accounts');
    }
  } catch (error) {
    console.error('❌ Failed to load service account:', error.message);
  }
}

if (!initialized) {
  // Check for GOOGLE_APPLICATION_CREDENTIALS environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: firebaseConfig.storageBucket
      });
      initialized = true;
      console.log('✅ Firebase Admin SDK initialized with application default credentials');
    } catch (error) {
      console.warn('Failed to use application default credentials:', error.message);
    }
  }
}

if (!initialized) {
  // Initialize without credentials - will fail on Firestore operations
  console.error('');
  console.error('╔════════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ FIREBASE SERVICE ACCOUNT NOT CONFIGURED                    ║');
  console.error('║                                                                ║');
  console.error('║  To fix this:                                                  ║');
  console.error('║  1. Go to Firebase Console → Project Settings                  ║');
  console.error('║  2. Click "Service accounts" tab                               ║');
  console.error('║  3. Click "Generate new private key"                           ║');
  console.error('║  4. Save as: backend/serviceAccountKey.json                    ║');
  console.error('╚════════════════════════════════════════════════════════════════╝');
  console.error('');
  
  // Initialize anyway to prevent crashes, but operations will fail
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket
    });
  } catch (error) {
    // Already initialized or other error
  }
}

// Export Firestore and Storage instances
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

export default admin;
