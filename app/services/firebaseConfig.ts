import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyChjkmNTCSL_M7qWlTB8dcIeBFe47aEgf4",
  authDomain: "vault-91d17.firebaseapp.com",
  projectId: "vault-91d17",
  storageBucket: "vault-91d17.firebasestorage.app",
  messagingSenderId: "465461474616",
  appId: "1:465461474616:web:4b2c460a75f779efb53dcd"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export default app;
