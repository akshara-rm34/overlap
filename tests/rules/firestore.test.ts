import { after, before, beforeEach, describe, it } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { checklist, newProfile, stay, testEnv } from './setup.ts';

let env: RulesTestEnvironment;
// alice and bob are verified and matched. carol is verified, not matched. dan is unverified.
const db = (uid: string | null) =>
  (uid
    ? env.authenticatedContext(uid)
    : env.unauthenticatedContext()
  ).firestore() as unknown as Firestore;
const convId = ['alice', 'bob'].sort().join('_');

before(async () => {
  env = await testEnv();
});
after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const admin = ctx.firestore() as unknown as Firestore;
    for (const [uid, verified] of [
      ['alice', true],
      ['bob', true],
      ['carol', true],
      ['dan', false],
    ] as const) {
      await setDoc(doc(admin, 'users', uid), {
        ...newProfile(uid),
        ...stay,
        verified,
        company: verified ? 'Acme' : null,
      });
    }
    const match = {
      overlapType: 'full',
      overlapDays: 82,
      overlapStart: '2027-06-07',
      overlapEnd: '2027-08-27',
    };
    await setDoc(doc(admin, 'matches/alice/items/bob'), { otherUid: 'bob', ...match });
    await setDoc(doc(admin, 'matches/bob/items/alice'), { otherUid: 'alice', ...match });
    await setDoc(doc(admin, 'verificationCodes/alice'), { codeHash: 'x', attempts: 0 });
    await setDoc(doc(admin, 'private/alice'), {
      workEmail: 'alice@acme.com',
      offerLetterStatus: 'none',
      offerLetterPath: null,
    });
  });
});

// Starts the alice/bob conversation the way the app does (conversation + first message in one batch).
function startConv(as: string, overrides: Record<string, unknown> = {}, id = convId) {
  const d = db(as);
  const batch = writeBatch(d);
  const conv = doc(d, 'conversations', id);
  batch.set(conv, {
    participants: id.split('_'),
    overlapType: 'full',
    createdBy: as,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastMessageText: 'hey',
    lastSenderId: as,
    updatedAt: serverTimestamp(),
    ...overrides,
  });
  batch.set(doc(collection(conv, 'messages')), {
    senderId: as,
    text: 'hey',
    sentAt: serverTimestamp(),
  });
  return batch.commit();
}

function reply(as: string, msg: Record<string, unknown> = {}, last: Record<string, unknown> = {}) {
  const d = db(as);
  const batch = writeBatch(d);
  const conv = doc(d, 'conversations', convId);
  batch.update(conv, {
    lastMessageAt: serverTimestamp(),
    lastMessageText: 'yo',
    lastSenderId: as,
    updatedAt: serverTimestamp(),
    ...last,
  });
  batch.set(doc(collection(conv, 'messages')), {
    senderId: as,
    text: 'yo',
    sentAt: serverTimestamp(),
    ...msg,
  });
  return batch.commit();
}

describe('users', () => {
  it('signed-out users cannot read profiles', async () => {
    await assertFails(getDoc(doc(db(null), 'users/alice')));
  });
  it('anyone can read their own profile', async () => {
    await assertSucceeds(getDoc(doc(db('dan'), 'users/dan')));
  });
  it('unverified users cannot read other profiles', async () => {
    await assertFails(getDoc(doc(db('dan'), 'users/alice')));
  });
  it('verified users can read other profiles', async () => {
    await assertSucceeds(getDoc(doc(db('alice'), 'users/dan')));
  });
  it('nobody can list all users', async () => {
    await assertFails(getDocs(collection(db('alice'), 'users')));
  });
  it('sign-up can create your own profile with server fields empty', async () => {
    await assertSucceeds(setDoc(doc(db('erin'), 'users/erin'), newProfile('Erin')));
  });
  it('sign-up cannot mark itself verified', async () => {
    await assertFails(
      setDoc(doc(db('erin'), 'users/erin'), { ...newProfile('Erin'), verified: true }),
    );
  });
  it('cannot create someone else’s profile', async () => {
    await assertFails(setDoc(doc(db('erin'), 'users/frank'), newProfile('Frank')));
  });
  it('owner can update stay and checklist', async () => {
    await assertSucceeds(
      updateDoc(doc(db('dan'), 'users/dan'), { ...stay, city: 'Seattle, WA', checklist }),
    );
  });
  it('owner cannot change server-only fields', async () => {
    for (const field of [
      'verified',
      'verificationMethod',
      'company',
      'verifiedAt',
      'participantId',
    ]) {
      await assertFails(
        updateDoc(doc(db('dan'), 'users/dan'), { [field]: field === 'verified' ? true : 'x' }),
      );
    }
  });
  it('cannot edit someone else’s profile', async () => {
    await assertFails(updateDoc(doc(db('alice'), 'users/bob'), { bio: 'hacked' }));
  });
  it('rejects bad stay data', async () => {
    const ref = doc(db('dan'), 'users/dan');
    await assertFails(updateDoc(ref, { startDate: 'June 7' }));
    await assertFails(updateDoc(ref, { endDate: '2027-06-01' })); // before start
    await assertFails(updateDoc(ref, { budgetMin: 5000 })); // above max
    await assertFails(updateDoc(ref, { bio: 'x'.repeat(281) }));
    await assertFails(updateDoc(ref, { somethingElse: true }));
  });
  it('rejects bad checklist answers', async () => {
    const ref = doc(db('dan'), 'users/dan');
    await assertFails(updateDoc(ref, { checklist: { ...checklist, cleanliness: 9 } }));
    await assertFails(updateDoc(ref, { checklist: { schedule: 'early' } }));
  });
  it('cannot delete a profile', async () => {
    await assertFails(deleteDoc(doc(db('dan'), 'users/dan')));
  });
});

describe('private', () => {
  it('owner can read, others cannot', async () => {
    await assertSucceeds(getDoc(doc(db('alice'), 'private/alice')));
    await assertFails(getDoc(doc(db('bob'), 'private/alice')));
  });
  it('owner can mark an offer letter as pending', async () => {
    await assertSucceeds(
      setDoc(
        doc(db('dan'), 'private/dan'),
        {
          offerLetterPath: 'offerLetters/dan/1.pdf',
          offerLetterStatus: 'pending',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    );
  });
  it('owner cannot approve their own letter or change their work email', async () => {
    const ref = doc(db('alice'), 'private/alice');
    await assertFails(
      setDoc(
        ref,
        { offerLetterPath: 'offerLetters/alice/1.pdf', offerLetterStatus: 'approved' },
        { merge: true },
      ),
    );
    await assertFails(setDoc(ref, { workEmail: 'me@google.com' }, { merge: true }));
  });
  it('offer letter path must be in your own folder', async () => {
    await assertFails(
      setDoc(
        doc(db('dan'), 'private/dan'),
        { offerLetterPath: 'offerLetters/alice/1.pdf', offerLetterStatus: 'pending' },
        { merge: true },
      ),
    );
  });
});

describe('verificationCodes', () => {
  it('no client access, even for the owner', async () => {
    await assertFails(getDoc(doc(db('alice'), 'verificationCodes/alice')));
    await assertFails(setDoc(doc(db('alice'), 'verificationCodes/alice'), { codeHash: 'y' }));
  });
});

describe('matches', () => {
  it('owner can read their matches', async () => {
    await assertSucceeds(getDocs(collection(db('alice'), 'matches/alice/items')));
  });
  it('others cannot read them', async () => {
    await assertFails(getDocs(collection(db('carol'), 'matches/alice/items')));
  });
  it('nobody can write matches from the app', async () => {
    await assertFails(
      setDoc(doc(db('carol'), 'matches/carol/items/alice'), {
        otherUid: 'alice',
        overlapType: 'full',
      }),
    );
  });
});

describe('conversations', () => {
  it('matched users can start a conversation', async () => {
    await assertSucceeds(startConv('alice'));
  });
  it('overlapType must match the match', async () => {
    await assertFails(startConv('alice', { overlapType: 'partial' }));
  });
  it('unmatched users cannot start one', async () => {
    await assertFails(startConv('carol', {}, ['alice', 'carol'].sort().join('_')));
  });
  it('the other person can reply', async () => {
    await startConv('alice');
    await assertSucceeds(reply('bob'));
  });
  it('outsiders cannot read, list, or post', async () => {
    await startConv('alice');
    await assertFails(getDoc(doc(db('carol'), 'conversations', convId)));
    await assertFails(getDocs(collection(db('carol'), 'conversations', convId, 'messages')));
    await assertFails(getDocs(collection(db('carol'), 'conversations')));
    await assertFails(reply('carol'));
  });
  it('participants can list their conversations', async () => {
    await startConv('alice');
    await assertSucceeds(
      getDocs(
        query(
          collection(db('bob'), 'conversations'),
          where('participants', 'array-contains', 'bob'),
        ),
      ),
    );
  });
  it('cannot send as someone else', async () => {
    await startConv('alice');
    await assertFails(reply('bob', { senderId: 'alice' }));
    await assertFails(reply('bob', {}, { lastSenderId: 'alice' }));
  });
  it('rejects empty and too-long messages', async () => {
    await startConv('alice');
    await assertFails(reply('bob', { text: '' }));
    await assertFails(reply('bob', { text: 'x'.repeat(2001) }));
  });
  it('messages cannot be edited or deleted', async () => {
    await startConv('alice');
    const msgs = await getDocs(collection(db('alice'), 'conversations', convId, 'messages'));
    await assertFails(updateDoc(msgs.docs[0].ref, { text: 'edited' }));
    await assertFails(deleteDoc(msgs.docs[0].ref));
  });
  it('cannot change participants or delete a conversation', async () => {
    await startConv('alice');
    await assertFails(
      updateDoc(doc(db('bob'), 'conversations', convId), { participants: ['bob', 'carol'] }),
    );
    await assertFails(deleteDoc(doc(db('bob'), 'conversations', convId)));
  });
});

describe('events', () => {
  const ev = (uid: string, name = 'search', extra: Record<string, unknown> = {}) => ({
    uid,
    name,
    props: { city: 'Atlanta, GA' },
    ts: serverTimestamp(),
    ...extra,
  });
  it('users can log their own events', async () => {
    await assertSucceeds(addDoc(collection(db('alice'), 'events'), ev('alice')));
  });
  it('cannot log as someone else', async () => {
    await assertFails(addDoc(collection(db('alice'), 'events'), ev('bob')));
  });
  it('cannot fake verify_completed or unknown events', async () => {
    await assertFails(addDoc(collection(db('alice'), 'events'), ev('alice', 'verify_completed')));
    await assertFails(addDoc(collection(db('alice'), 'events'), ev('alice', 'made_up')));
  });
  it('rejects extra fields and client timestamps', async () => {
    await assertFails(
      addDoc(collection(db('alice'), 'events'), ev('alice', 'search', { email: 'x' })),
    );
    await assertFails(
      addDoc(collection(db('alice'), 'events'), ev('alice', 'search', { ts: new Date() })),
    );
  });
  it('events cannot be read, edited, or deleted', async () => {
    const ref = await addDoc(collection(db('alice'), 'events'), ev('alice'));
    const mine = doc(db('alice'), 'events', ref.id);
    await assertFails(getDoc(mine));
    await assertFails(getDocs(collection(db('alice'), 'events')));
    await assertFails(updateDoc(mine, { name: 'signup' }));
    await assertFails(deleteDoc(mine));
  });
});
