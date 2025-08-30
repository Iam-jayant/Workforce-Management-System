import app from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';

// Firebase configuration object - for reference
// React Native Firebase will use google-services.json (Android) and GoogleService-Info.plist (iOS)
export const firebaseConfig = {
  apiKey: "AIzaSyDvxzNWR0wEXO2843qWUS7fWfVj3mQCmyE",
  authDomain: "workforce-management-96f07.firebaseapp.com",
  databaseURL: "https://workforce-management-96f07-default-rtdb.firebaseio.com",
  projectId: "workforce-management-96f07",
  storageBucket: "workforce-management-96f07.firebasestorage.app",
  messagingSenderId: "793542234468",
  appId: "1:793542234468:web:64cd146dba64ab7499ea71",
};

// Export Firebase services - React Native Firebase handles initialization automatically
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseDatabase = database();
export const firebaseStorage = storage();
export const firebaseMessaging = messaging();
export const firebaseFunctions = functions();

export default app;