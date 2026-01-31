import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB...", // Needs to be hidden or moved to env
  authDomain: "surecyonetim-6d843.firebaseapp.com",
  projectId: "surecyonetim-6d843",
  storageBucket: "surecyonetim-6d843.firebasestorage.app",
  messagingSenderId: "144983058428",
  appId: "1:144983058428:web:7f8475583b4007d3910543"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
