import { FieldValue, getFirestore, type Transaction } from 'firebase-admin/firestore';

// Server-side events (same shape as the app's logEvent).
export function logServerEvent(
  name: 'verify_completed',
  uid: string,
  props: Record<string, unknown>,
  tx?: Transaction,
) {
  const db = getFirestore();
  const ref = db.collection('events').doc();
  const data = { uid, name, props, ts: FieldValue.serverTimestamp() };
  if (tx) tx.set(ref, data);
  else return ref.set(data);
}
