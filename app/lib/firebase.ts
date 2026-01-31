import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// BU AYARLARI FIREBASE CONSOLE'DAN ALMALISINIZ
// Project Settings > Web Apps > Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyA2tKyd8xnVA6a0EPSz5fgj3jO_XIzDQr8",
    authDomain: "surecyonetimi-658d0.firebaseapp.com",
    projectId: "surecyonetimi-658d0",
    storageBucket: "surecyonetimi-658d0.firebasestorage.app",
    messagingSenderId: "497169734876",
    appId: "1:497169734876:web:e4922d4977eafc6ce9e819",
    measurementId: "G-ZM4V8FV9D2"
};
// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };