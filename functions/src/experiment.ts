import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/firestore';

import { VARIANTS } from './config';
import { logServerEvent } from './events';

// Puts each new profile in an A/B group (Sprint 4: required vs. optional verification).
// Groups alternate in sign-up order so they stay balanced with a small number of testers.
// Profiles from before Sprint 4 get a group on their next write.
export const assignVariant = onDocumentWritten('users/{uid}', async (event) => {
  const after = event.data?.after;
  if (!after?.exists || after.get('variant')) return;

  const uid = event.params.uid;
  const db = getFirestore();
  const counterRef = db.doc('meta/experiment');
  await db.runTransaction(async (tx) => {
    const [counter, user] = await Promise.all([tx.get(counterRef), tx.get(after.ref)]);
    if (!user.exists || user.get('variant')) return;
    const n = (counter.get('assigned') as number | undefined) ?? 0;
    const variant = VARIANTS[n % VARIANTS.length];
    tx.set(counterRef, { assigned: n + 1 }, { merge: true });
    tx.update(after.ref, { variant });
    logServerEvent('variant_assigned', uid, { variant }, tx);
  });
});
