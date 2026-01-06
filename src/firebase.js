// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// ▼ doc, getDoc, setDoc を追加しました
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

// ▼【重要】ここはあなたの設定のままにしてください！
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
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ▼ doc, getDoc, setDoc をexportに追加しました
export { auth, db, provider, signInWithPopup, signOut, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, setDoc };