import { initializeApp } from "firebase/app";

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
  setDoc,
  writeBatch
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

export { 
  auth, 
  provider, 
  signInWithPopup, 
  signOut, 
  signInAnonymously, 
  db, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  writeBatch // 追加
};