import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "plannerActivities";

export async function loadPlannerMetadata() {
  const snap = await getDocs(collection(db, COLLECTION));
  const out = new Map();
  snap.forEach(s => out.set(s.id, s.data()));
  return out;
}

export async function savePlannerMetadata(id, data) {
  await setDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function removePlannerMetadata(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
