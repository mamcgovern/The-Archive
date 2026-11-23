import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCcgMv98-a2gNZpS5Vydsus7Ub_DCkCGLg",
  authDomain: "the-archive-11c2d.firebaseapp.com",
  projectId: "the-archive-11c2d",
  storageBucket: "the-archive-11c2d.firebasestorage.app",
  messagingSenderId: "888580922398",
  appId: "1:888580922398:web:5a092f2b058fd82c5e220f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;