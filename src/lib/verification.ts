import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes } from 'firebase/storage';

import { auth, db, functions, storage } from './firebase';

export const MAX_OFFER_LETTER_BYTES = 10 * 1024 * 1024;

const sendCodeFn = httpsCallable<{ workEmail: string }, { ok: true; devCode?: string }>(
  functions,
  'sendVerificationCode',
);
const confirmCodeFn = httpsCallable<{ code: string }, { company: string }>(
  functions,
  'confirmVerificationCode',
);

// Returns the code only when running against the emulators, for testing without a real inbox.
export async function sendVerificationCode(workEmail: string): Promise<string | undefined> {
  const res = await sendCodeFn({ workEmail });
  return res.data.devCode;
}

export async function confirmVerificationCode(code: string) {
  const res = await confirmCodeFn({ code });
  return res.data.company;
}

export async function uploadOfferLetter(file: { uri: string; name: string; mimeType: string }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'pdf';
  const path = `offerLetters/${uid}/${Date.now()}.${ext}`;
  const blob = await (await fetch(file.uri)).blob();
  await uploadBytes(ref(storage, path), blob, { contentType: file.mimeType });
  await setDoc(
    doc(db, 'private', uid),
    { offerLetterPath: path, offerLetterStatus: 'pending', updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// Functions errors carry a readable message from the server, with the HTTP status appended
// (e.g. "Wrong code. 4 tries left. [400]"). Status 0 means the request never reached the server.
export function verifyErrorMessage(err: unknown): string {
  const { code, message } = (err ?? {}) as { code?: string; message?: string };
  const match = message?.match(/^(.*?)\s*\[(\d+)\]$/);
  const text = match ? match[1] : message;
  const status = match ? Number(match[2]) : undefined;

  if (status === 0 || code === 'functions/unavailable') {
    return 'Can’t reach the server. Check your connection.';
  }
  if (code?.startsWith('functions/') && text && text !== 'internal') return text;
  return 'Something went wrong. Please try again.';
}

// Team-only offer-letter review. The server checks the admin list, so these fail for everyone else.
export type PendingLetter = {
  uid: string;
  displayName: string;
  path: string;
  uploadedAt: string | null;
};

const listLettersFn = httpsCallable<void, { letters: PendingLetter[] }>(
  functions,
  'listOfferLetters',
);
const approveLetterFn = httpsCallable<{ uid: string; company: string }, { ok: true }>(
  functions,
  'approveOfferLetter',
);
const rejectLetterFn = httpsCallable<{ uid: string }, { ok: true }>(functions, 'rejectOfferLetter');

export async function listOfferLetters() {
  return (await listLettersFn()).data.letters;
}

export async function approveOfferLetter(uid: string, company: string) {
  await approveLetterFn({ uid, company });
}

export async function rejectOfferLetter(uid: string) {
  await rejectLetterFn({ uid });
}
