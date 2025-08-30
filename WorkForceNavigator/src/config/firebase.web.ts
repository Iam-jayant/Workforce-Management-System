// Firebase Web SDK configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

// Firebase configuration object using environment variables
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const firebaseAuth = getAuth(app);
export const firebaseFirestore = getFirestore(app);
export const firebaseDatabase = getDatabase(app);
export const firebaseStorage = getStorage(app);
export const firebaseFunctions = getFunctions(app);

// Initialize messaging only if supported (not in all environments)
let firebaseMessaging: any = null;
try {
  isSupported().then((supported) => {
    if (supported) {
      firebaseMessaging = getMessaging(app);
    }
  });
} catch (error) {
  console.warn('Firebase messaging not supported in this environment');
}

export { firebaseMessaging };
export default app;