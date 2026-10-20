// Shared setup for the analysis scripts.
//
// By default they run against the local emulators. Add --project <id> to use the real
// Firebase project (run `gcloud auth application-default login` first).

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore, type Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { ADMIN_UIDS } from '../../functions/src/config.ts';

export const args = process.argv.slice(2);

export function flag(name: string): boolean {
  return args.includes(`--${name}`);
}

export function option(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const realProject = option('project');
export const isEmulator = !realProject;
export const projectId = realProject ?? 'demo-overlap';

if (isEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199';
}

// New projects use <id>.firebasestorage.app; older ones use <id>.appspot.com.
const bucketName =
  option('bucket') ??
  (isEmulator ? `${projectId}.appspot.com` : `${projectId}.firebasestorage.app`);

initializeApp({ projectId, storageBucket: bucketName });
export const db = getFirestore();
export const auth = getAuth();
export const bucket = () => getStorage().bucket();

export function describeTarget() {
  return isEmulator ? 'local emulators (demo-overlap)' : `real project ${projectId}`;
}

// ---------- events + participant ids ----------

export type EventDoc = {
  uid: string;
  name: string;
  props: Record<string, unknown>;
  ts: Timestamp | null;
};

export async function loadEvents(): Promise<EventDoc[]> {
  const snap = await db.collection('events').orderBy('ts').get();
  return snap.docs.map((d) => d.data() as EventDoc);
}

// Team accounts (the admin list in functions/src/config.ts) are left out unless --include-team.
export function isTeam(uid: string) {
  return !flag('include-team') && ADMIN_UIDS.includes(uid);
}

// Gives every user a participantId (P01, P02, ...) in sign-up order and saves it on their
// profile, so the same person keeps the same id across exports.
export async function participantIds(db: Firestore): Promise<Map<string, string>> {
  const snap = await db.collection('users').get();
  const users = snap.docs
    .map((d) => ({
      uid: d.id,
      pid: d.get('participantId') as string | null,
      createdAt: (d.get('createdAt') as Timestamp | null)?.toMillis() ?? 0,
    }))
    .sort((a, b) => a.createdAt - b.createdAt);

  const ids = new Map<string, string>();
  let next = Math.max(0, ...users.map((u) => Number(u.pid?.slice(1)) || 0)) + 1;
  const batch = db.batch();
  let changed = 0;
  for (const u of users) {
    if (!u.pid) {
      u.pid = `P${String(next++).padStart(2, '0')}`;
      batch.update(db.doc(`users/${u.uid}`), { participantId: u.pid });
      changed++;
    }
    ids.set(u.uid, u.pid);
  }
  if (changed) await batch.commit();
  return ids;
}

// Accounts deleted before the export have no profile, so no id.
export function pidOf(ids: Map<string, string>, uid: string) {
  return ids.get(uid) ?? 'unknown';
}
