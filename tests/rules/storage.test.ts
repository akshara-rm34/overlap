import { after, before, describe, it } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';

import { testEnv } from './setup.ts';

let env: RulesTestEnvironment;
const storage = (uid: string) =>
  env.authenticatedContext(uid).storage() as unknown as FirebaseStorage;
const bytes = (n: number) => new Uint8Array(n);

before(async () => {
  env = await testEnv();
});
after(async () => {
  await env.cleanup();
});

describe('offer letters', () => {
  it('owner can upload a PDF or image', async () => {
    await assertSucceeds(
      uploadBytes(ref(storage('dan'), 'offerLetters/dan/a.pdf'), bytes(10), {
        contentType: 'application/pdf',
      }),
    );
    await assertSucceeds(
      uploadBytes(ref(storage('dan'), 'offerLetters/dan/b.jpg'), bytes(10), {
        contentType: 'image/jpeg',
      }),
    );
  });
  it('other file types are rejected', async () => {
    await assertFails(
      uploadBytes(ref(storage('dan'), 'offerLetters/dan/c.txt'), bytes(10), {
        contentType: 'text/plain',
      }),
    );
  });
  it('files over 10 MB are rejected', async () => {
    await assertFails(
      uploadBytes(ref(storage('dan'), 'offerLetters/dan/big.pdf'), bytes(10 * 1024 * 1024 + 1), {
        contentType: 'application/pdf',
      }),
    );
  });
  it('cannot upload into someone else’s folder', async () => {
    await assertFails(
      uploadBytes(ref(storage('dan'), 'offerLetters/alice/a.pdf'), bytes(10), {
        contentType: 'application/pdf',
      }),
    );
  });
  it('nobody can read letters from the app, including the owner', async () => {
    await assertFails(getBytes(ref(storage('dan'), 'offerLetters/dan/a.pdf')));
  });
  it('nothing else in storage is writable', async () => {
    await assertFails(
      uploadBytes(ref(storage('dan'), 'other/a.pdf'), bytes(10), {
        contentType: 'application/pdf',
      }),
    );
  });
});
