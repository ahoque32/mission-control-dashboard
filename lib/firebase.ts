import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAFGOvoH727DMiJ0dJb4UfFQI7VrB4XF1w',
  authDomain: 'openclawdb-63f64.firebaseapp.com',
  projectId: 'openclawdb-63f64',
  storageBucket: 'openclawdb-63f64.firebasestorage.app',
  messagingSenderId: '219807980935',
  appId: '1:219807980935:web:03ae4aba9e08483efc0722',
};

// Initialize Firebase (prevent re-initialization in dev with HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
