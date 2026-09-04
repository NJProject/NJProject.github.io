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

export async function savePlannerMetadataBulk(entries) {
  // entries: { [activityId]: { location, durationMin, openingHours, availableDates } }
  const results = { ok: [], failed: [] };
  for (const [id, data] of Object.entries(entries)) {
    try {
      await setDoc(doc(db, COLLECTION, id), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      results.ok.push(id);
    } catch (e) {
      results.failed.push({ id, error: e.message });
    }
  }
  return results;
}