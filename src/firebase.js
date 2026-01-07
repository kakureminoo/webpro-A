import { initializeApp } from "firebase/app";

// ▼ ここで自分自身 (./firebase) をインポートしてはいけません。削除しました。

// 必要な機能をFirebase SDKから直接インポートします
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
  writeBatch // reset.jsxで使用するため追加しておくと便利です
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

// 初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app); // ここでdbを定義します

// まとめてエクスポート
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