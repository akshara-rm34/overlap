import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/firestore';

import { budgetFit, computeOverlap, type BudgetFit, type Overlap } from './overlap';

// Any of these changing means the matches (or the card copied into them) need rebuilding.
const WATCHED = [
  'displayName',
  'city',
  'startDate',
  'endDate',
  'budgetMin',
  'budgetMax',
  'housingStatus',
  'verified',
  'verificationMethod',
  'company',
  'variant',
] as const;

function hasStay(u: DocumentData | undefined): u is DocumentData {
  return !!u && !!u.city && !!u.startDate && !!u.endDate;
}

// Who shows up in other people's lists: verified users, plus everyone in the optional group
// (they have full access before verifying). Unverified users in the required group can browse
// their matches but don't appear to others until they verify.
function listable(u: DocumentData | undefined): u is DocumentData {
  return hasStay(u) && (u.verified === true || u.variant === 'optional');
}

// The limited profile copied into each match. Users who are still verifying only see this,
// since the rules don't let them read full profiles.
export type MatchCardData = {
  firstName: string;
  company: string | null;
  verificationMethod: 'work_email' | 'offer_letter' | null;
  startDate: string;
  endDate: string;
  budgetMin: number | null;
  budgetMax: number | null;
  housingStatus: string | null;
};

function cardFor(u: DocumentData): MatchCardData {
  const name = typeof u.displayName === 'string' ? u.displayName.trim() : '';
  return {
    firstName: name.split(/\s+/)[0] || 'Someone',
    company: u.verified === true ? (u.company ?? null) : null,
    verificationMethod: u.verified === true ? (u.verificationMethod ?? null) : null,
    startDate: u.startDate,
    endDate: u.endDate,
    budgetMin: u.budgetMin ?? null,
    budgetMax: u.budgetMax ?? null,
    housingStatus: u.housingStatus ?? null,
  };
}

type Pair = Overlap & { budgetFit: BudgetFit };

// Rebuilds a user's matches in both directions when their stay, budget, card, or access changes.
//   matches/{uid}/items/{other}  = people this user sees (other is listable)
//   matches/{other}/items/{uid}  = this user in other people's lists (this user is listable)
export const computeMatches = onDocumentWritten('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  const changed = WATCHED.some((k) => before?.[k] !== after?.[k]);
  if (!changed) return;

  const db = getFirestore();
  const mine = db.collection(`matches/${uid}/items`);

  // Everyone in the same city whose dates overlap, regardless of access.
  const pairs = new Map<string, { pair: Pair; other: DocumentData }>();
  if (hasStay(after)) {
    const sameCity = await db.collection('users').where('city', '==', after.city).get();
    for (const doc of sameCity.docs) {
      if (doc.id === uid) continue;
      const other = doc.data();
      if (!hasStay(other)) continue;
      const overlap = computeOverlap(after as never, other as never);
      if (overlap) pairs.set(doc.id, { pair: { ...overlap, budgetFit: budgetFit(after, other) }, other });
    }
  }

  const [existingMine, pointingAtMe] = await Promise.all([
    mine.get(),
    db.collectionGroup('items').where('otherUid', '==', uid).get(),
  ]);

  const batch = db.batch();
  const computedAt = FieldValue.serverTimestamp();
  let shown = 0;
  let listedFor = 0;

  // My list.
  const keepMine = new Set<string>();
  for (const [otherUid, { pair, other }] of pairs) {
    if (!listable(other)) continue;
    keepMine.add(otherUid);
    batch.set(mine.doc(otherUid), { otherUid, ...pair, card: cardFor(other), computedAt });
    shown++;
  }
  for (const doc of existingMine.docs) {
    if (!keepMine.has(doc.id)) batch.delete(doc.ref);
  }

  // Me in other people's lists.
  const keepTheirs = new Set<string>();
  if (listable(after)) {
    const myCard = cardFor(after);
    for (const [otherUid, { pair }] of pairs) {
      keepTheirs.add(otherUid);
      batch.set(db.doc(`matches/${otherUid}/items/${uid}`), {
        otherUid: uid,
        ...pair,
        card: myCard,
        computedAt,
      });
      listedFor++;
    }
  }
  for (const doc of pointingAtMe.docs) {
    const owner = doc.ref.parent.parent?.id; // matches/{owner}/items/{uid}
    if (owner && !keepTheirs.has(owner)) batch.delete(doc.ref);
  }

  await batch.commit();
  logger.info('computeMatches', { uid, shown, listedFor });
});
