import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/firestore';

import { computeOverlap, type Overlap } from './overlap';

const WATCHED = ['city', 'startDate', 'endDate', 'verified'] as const;

function eligible(u: DocumentData | undefined): u is DocumentData {
  return !!u && u.verified === true && !!u.city && !!u.startDate && !!u.endDate;
}

// Recomputes a user's matches when their city, dates, or verified flag change.
// Each match is written to both users' matches collections.
export const computeMatches = onDocumentWritten('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  const changed = WATCHED.some((k) => before?.[k] !== after?.[k]);
  if (!changed) return;

  const db = getFirestore();
  const mine = db.collection(`matches/${uid}/items`);

  const next = new Map<string, Overlap>();
  if (eligible(after)) {
    const sameCity = await db
      .collection('users')
      .where('city', '==', after.city)
      .where('verified', '==', true)
      .get();
    for (const doc of sameCity.docs) {
      if (doc.id === uid) continue;
      const other = doc.data();
      if (!other.startDate || !other.endDate) continue;
      const overlap = computeOverlap(
        { startDate: after.startDate, endDate: after.endDate },
        { startDate: other.startDate, endDate: other.endDate },
      );
      if (overlap) next.set(doc.id, overlap);
    }
  }

  const existing = await mine.get();
  const batch = db.batch();
  for (const doc of existing.docs) {
    if (!next.has(doc.id)) {
      batch.delete(doc.ref);
      batch.delete(db.doc(`matches/${doc.id}/items/${uid}`));
    }
  }
  for (const [otherUid, overlap] of next) {
    const computedAt = FieldValue.serverTimestamp();
    batch.set(mine.doc(otherUid), { otherUid, ...overlap, computedAt });
    batch.set(db.doc(`matches/${otherUid}/items/${uid}`), { otherUid: uid, ...overlap, computedAt });
  }
  await batch.commit();

  logger.info('computeMatches', { uid, matches: next.size, removed: existing.size - next.size });
});
