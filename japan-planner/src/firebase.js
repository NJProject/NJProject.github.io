import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/*
 * Même projet Firebase que le guide actuel.
 * Si firebase-config.js du dépôt change un jour, mettre à jour ces valeurs.
 * Les clés Firebase Web ne sont pas des secrets ; la sécurité doit être faite
 * avec les règles Firestore.
 */
const firebaseConfig = {
  apiKey: "AIzaSyApNdRwQ4KTr8qWtQhY8zfuQU5Law6Uq1c",
  authDomain: "japon-2027-votes.firebaseapp.com",
  projectId: "japon-2027-votes",
  storageBucket: "japon-2027-votes.firebasestorage.app",
  messagingSenderId: "892506943653",
  appId: "1:892506943653:web:47e6dee1bc051706451d4c"
};

export const db = getFirestore(initializeApp(firebaseConfig));
