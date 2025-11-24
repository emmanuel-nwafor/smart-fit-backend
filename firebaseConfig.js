import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyCo_lFVtxNESkp7rMts2IqM38SJZH1JZyE",
  authDomain: "smart-fit-8070b.firebaseapp.com",
  projectId: "smart-fit-8070b",
  storageBucket: "smart-fit-8070b.firebasestorage.app",
  messagingSenderId: "340165127422",
  appId: "1:340165127422:web:2a3af4090f52072fe709af",
  measurementId: "G-M51FWFXJ94"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

