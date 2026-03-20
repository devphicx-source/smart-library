import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB1bJpgmH_G0fv5X7eBnUa92vvTCv0XgzQ",
  authDomain: "smart-library-b488d.firebaseapp.com",
  projectId: "smart-library-b488d",
  storageBucket: "smart-library-b488d.firebasestorage.app",
  messagingSenderId: "799717449597",
  appId: "1:799717449597:web:d3efc7541303a4dc767614"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { auth };
