// ─────────────────────────────────────────────────────────────
// js/firebase-init.js — จุดเชื่อมต่อ Firestore จุดเดียวของทั้งระบบ
// หน้าไหนจะคุยกับ Firestore ให้ import { db } จากไฟล์นี้
// ─────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYonpEXfdzlsat8IroCCDAj--t5egZ1no",
  authDomain: "leaveeasy-anon.firebaseapp.com",
  projectId: "leaveeasy-anon",
  storageBucket: "leaveeasy-anon.firebasestorage.app",
  messagingSenderId: "27276715292",
  appId: "1:27276715292:web:1f71f0aeda70cbec0506d9",
  measurementId: "G-4Z469K835H"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
