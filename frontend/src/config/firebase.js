import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5rdQP7xDBOOWfsFb2jl79y19tzdUISpY",
  authDomain: "academia-share.firebaseapp.com",
  projectId: "academia-share",
  messagingSenderId: "719998519435",
  appId: "1:719998519435:web:486bf88a558e6cba936c8e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);