// src/firebase.js
import { initializeApp } from "firebase/app";
// ▼ ここに signInAnonymously が必要です
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInAnonymously 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAkmHUutBh7YcS3Fj6Aqf8P_BqeiU21n7U",
  authDomain: "rpg-exploration.firebaseapp.com",
  projectId: "rpg-exploration",
  storageBucket: "rpg-exploration.firebasestorage.app",
  messagingSenderId: "553953765804",
  appId: "1:553953765804:web:d2a7a8770c2fd958017209",
  measurementId: "G-067NQE1HMZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// ▼ ここで signInAnonymously を外に出す（エクスポート）必要があります
export { 
  auth, 
  provider, 
  signInWithPopup, 
  signOut, 
  signInAnonymously,  // ← これがないと画面が白くなります！
  db, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc 
};