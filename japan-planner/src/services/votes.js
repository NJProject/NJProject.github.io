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
        const data = snap.exists() ? snap.data() : {};
        return [id, data.voters || {}, data.excluders || {}];
      })
    );
    for (const [id, voters, excluders] of docs) {
      votes.set(id, {
        voters: Object.entries(voters).filter(([, v]) => v === true).map(([n]) => n),
        excluders: Object.entries(excluders).filter(([, v]) => v === true).map(([n]) => n)
      });
    }
  }
  return votes;
}

export function votersForActivity(votes, activityId) {
  return votes.get(activityId)?.voters || [];
}

export function excludersForActivity(votes, activityId) {
  return votes.get(activityId)?.excluders || [];
}

export function allVoters(votes) {
  const set = new Set();
  for (const entry of votes.values()) {
    (entry.voters || []).forEach(n => set.add(n));
    (entry.excluders || []).forEach(n => set.add(n));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
