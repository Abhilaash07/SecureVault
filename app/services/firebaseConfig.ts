import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyChjkmNTCSL_M7qWlTB8dcIeBFe47aEgf4",
  authDomain: "vault-91d17.firebaseapp.com",
  projectId: "vault-91d17",
  storageBucket: "vault-91d17.firebasestorage.app",
  messagingSenderId: "465461474616",
  appId: "1:465461474616:web:4b2c460a75f779efb53dcd"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance: any;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch {
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export default app;
