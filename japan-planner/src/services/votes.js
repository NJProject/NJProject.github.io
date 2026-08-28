import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function loadVotes(activityIds) {
  const votes = new Map();
  const chunks = [];
  for (let i = 0; i < activityIds.length; i += 20) {
    chunks.push(activityIds.slice(i, i + 20));
  }
  for (const chunk of chunks) {
    const docs = await Promise.all(
      chunk.map(async id => {
        const snap = await getDoc(doc(db, "votes", id));
        return [id, snap.exists() ? (snap.data().voters || {}) : {}];
      })
    );
    for (const [id, voters] of docs) {
      votes.set(id, Object.entries(voters)
        .filter(([, value]) => value === true)
        .map(([name]) => name));
    }
  }
  return votes;
}

export function votersForActivity(votes, activityId) {
  return votes.get(activityId) || [];
}

export function allVoters(votes) {
  const set = new Set();
  for (const names of votes.values()) names.forEach(n => set.add(n));
  return [...set].sort((a, b) => a.localeCompare(b));
}
