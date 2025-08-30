// Firebase Web SDK configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

// Firebase configuration object
export const firebaseConfig = {
  apiKey: "AIzaSyDvxzNWR0wEXO2843qWUS7fWfVj3mQCmyE",
  authDomain: "workforce-management-96f07.firebaseapp.com",
  databaseURL: "https://workforce-management-96f07-default-rtdb.firebaseio.com",
  projectId: "workforce-management-96f07",
  storageBucket: "workforce-management-96f07.firebasestorage.app",
  messagingSenderId: "793542234468",
  appId: "1:793542234468:web:64cd146dba64ab7499ea71",
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