import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/https';

import { ADMIN_UIDS } from './config';
import { logServerEvent } from './events';

// Team-only. Letters are opened in the Firebase console (Storage), then approved or rejected here.

function requireAdmin(auth: { uid: string } | undefined): string {
  if (!auth) throw new HttpsError('unauthenticated', 'Please sign in first.');
  if (!ADMIN_UIDS.includes(auth.uid)) {
    throw new HttpsError('permission-denied', 'Only the Overlap team can review offer letters.');
  }
  return auth.uid;
}

function requireTargetUid(data: unknown): string {
  const uid = (data as { uid?: unknown })?.uid;
  if (typeof uid !== 'string' || !uid) throw new HttpsError('invalid-argument', 'Missing uid.');
  return uid;
}

// Deletes everything the user uploaded, not just the latest file.
async function deleteLetters(uid: string) {
  try {
    await getStorage()
      .bucket()
      .deleteFiles({ prefix: `offerLetters/${uid}/` });
  } catch (err) {
    logger.error('deleteLetters failed', { uid, err: String(err) });
  }
}

// What the reviewer checks by hand (Sprint 4). Anything left unchecked is logged as a mismatch,
// which tells us what an automated pre-check would need to flag.
export const LETTER_CHECKS = ['name', 'company', 'role', 'city', 'dates', 'not_edited'] as const;
type LetterCheck = (typeof LETTER_CHECKS)[number];

function readMismatches(data: unknown): LetterCheck[] {
  const raw = (data as { mismatches?: unknown })?.mismatches;
  if (!Array.isArray(raw)) return [];
  return LETTER_CHECKS.filter((c) => raw.includes(c));
}

// Seconds the reviewer spent on the letter (first checklist tap to decision), sent by the app.
function readHandsOn(data: unknown): number | null {
  const raw = (data as { handsOnSeconds?: unknown })?.handsOnSeconds;
  return typeof raw === 'number' && raw >= 0 && raw < 24 * 3600 ? Math.round(raw) : null;
}

// Minutes from upload to the review decision (includes time the letter sat in the queue).
function minutesSince(uploadedAt: Timestamp | undefined): number | null {
  if (!uploadedAt) return null;
  return Math.round(((Date.now() - uploadedAt.toMillis()) / 60000) * 10) / 10;
}

export type PendingLetter = {
  uid: string;
  displayName: string;
  path: string;
  uploadedAt: string | null; // ISO
  // Their stay, so the reviewer can compare it with the letter.
  city: string | null;
  startDate: string | null;
  endDate: string | null;
};

export const listOfferLetters = onCall({ invoker: 'public' }, async (req) => {
  requireAdmin(req.auth);
  const db = getFirestore();
  const snap = await db.collection('private').where('offerLetterStatus', '==', 'pending').get();
  const letters: PendingLetter[] = await Promise.all(
    snap.docs.map(async (d) => {
      const user = await db.doc(`users/${d.id}`).get();
      const updatedAt = d.get('updatedAt') as Timestamp | undefined;
      return {
        uid: d.id,
        displayName: (user.get('displayName') as string | undefined) ?? '(no profile)',
        path: d.get('offerLetterPath') as string,
        uploadedAt: updatedAt ? updatedAt.toDate().toISOString() : null,
        city: (user.get('city') as string | undefined) ?? null,
        startDate: (user.get('startDate') as string | undefined) ?? null,
        endDate: (user.get('endDate') as string | undefined) ?? null,
      };
    }),
  );
  letters.sort((a, b) => (a.uploadedAt ?? '').localeCompare(b.uploadedAt ?? ''));
  return { letters };
});

export const approveOfferLetter = onCall({ invoker: 'public' }, async (req) => {
  requireAdmin(req.auth);
  const uid = requireTargetUid(req.data);
  const mismatches = readMismatches(req.data);
  const handsOnSeconds = readHandsOn(req.data);
  const raw = (req.data as { company?: unknown }).company;
  const company = typeof raw === 'string' ? raw.trim() : '';
  if (!company || company.length > 60) {
    throw new HttpsError('invalid-argument', 'Enter the company name from the letter.');
  }

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const privateRef = db.doc(`private/${uid}`);
  await db.runTransaction(async (tx) => {
    const [user, priv] = await Promise.all([tx.get(userRef), tx.get(privateRef)]);
    if (!user.exists) throw new HttpsError('not-found', 'That user has no profile.');
    if (priv.get('offerLetterStatus') !== 'pending') {
      throw new HttpsError('failed-precondition', 'That letter isn’t pending anymore.');
    }
    tx.update(userRef, {
      verified: true,
      verificationMethod: 'offer_letter',
      company,
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(privateRef, {
      offerLetterStatus: 'approved',
      offerLetterPath: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    logServerEvent('verify_completed', uid, { method: 'offer_letter' }, tx);
    logServerEvent(
      'letter_reviewed',
      uid,
      {
        decision: 'approved',
        reviewMinutes: minutesSince(priv.get('updatedAt') as Timestamp | undefined),
        handsOnSeconds,
        mismatches,
      },
      tx,
    );
  });
  await deleteLetters(uid);
  return { ok: true };
});

export const rejectOfferLetter = onCall({ invoker: 'public' }, async (req) => {
  requireAdmin(req.auth);
  const uid = requireTargetUid(req.data);
  const mismatches = readMismatches(req.data);
  const handsOnSeconds = readHandsOn(req.data);
  const privateRef = getFirestore().doc(`private/${uid}`);
  const priv = await privateRef.get();
  if (priv.get('offerLetterStatus') !== 'pending') {
    throw new HttpsError('failed-precondition', 'That letter isn’t pending anymore.');
  }
  // The user sees the verify screens again and can re-upload or use a work email.
  await privateRef.update({
    offerLetterStatus: 'rejected',
    offerLetterPath: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await logServerEvent('letter_reviewed', uid, {
    decision: 'rejected',
    reviewMinutes: minutesSince(priv.get('updatedAt') as Timestamp | undefined),
    handsOnSeconds,
    mismatches,
  });
  await deleteLetters(uid);
  return { ok: true };
});
