// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// ▼ doc, getDoc, setDoc を追加しました
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

// ▼【重要】ここはあなたの設定のままにしてください！
const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ▼ doc, getDoc, setDoc をexportに追加しました
export { auth, db, provider, signInWithPopup, signOut, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, setDoc };