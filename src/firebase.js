// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBV67B1XxEr-32H1IBLX3g-d7wPgFUEjGc",
  authDomain: "financas-app-c613f.firebaseapp.com",
  projectId: "financas-app-c613f",
  storageBucket: "financas-app-c613f.appspot.com",
  messagingSenderId: "980703033495",
  appId: "1:980703033495:web:2a24de1fe9f93b7ea151d2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
