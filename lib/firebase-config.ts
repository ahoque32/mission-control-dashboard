// Firebase configuration for Mission Control
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFGOvoH727DMiJ0dJb4UfFQI7VrB4XF1w",
  authDomain: "openclawdb-63f64.firebaseapp.com",
  projectId: "openclawdb-63f64",
  storageBucket: "openclawdb-63f64.firebasestorage.app",
  messagingSenderId: "219807980935",
  appId: "1:219807980935:web:03ae4aba9e08483efc0722"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db, firebaseConfig };
