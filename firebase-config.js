// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApNdRwQ4KTr8qWtQhY8zfuQU5Law6Uq1c",
  authDomain: "japon-2027-votes.firebaseapp.com",
  projectId: "japon-2027-votes",
  storageBucket: "japon-2027-votes.firebasestorage.app",
  messagingSenderId: "892506943653",
  appId: "1:892506943653:web:47e6dee1bc051706451d4c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);